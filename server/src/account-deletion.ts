import { Router, Request, Response as ExpressResponse } from 'express';
import { Pool, PoolClient } from 'pg';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import nodemailer from 'nodemailer';
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'crypto';

const BASE = '/api/dead-city/account-deletion';
const MAX_ATTEMPTS = 5;
const CODE_TTL_MS = 10 * 60 * 1000;

type UnityUser = { id: string; externalIds?: Array<{ providerId: string; externalId: string }> };
type DeletionRow = {
  verification_id: string; player_id: string; google_subject: string; email_hash: string;
  code_hash: string | null; expires_at: Date; attempts: number;
  status: 'pending' | 'deleting' | 'completed'; deletion_steps: Record<string, boolean>;
};

class HttpError extends Error {
  constructor(public status: number, message: string, public retryAfter?: string) { super(message); }
}

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
};

const digest = (value: string): string =>
  createHmac('sha256', required('DEAD_CITY_DELETION_PEPPER')).update(value).digest('hex');

const codeDigest = (verificationId: string, code: string): string => digest(`${verificationId}:${code}`);
const safeEqual = (a: string, b: string): boolean => {
  const left = Buffer.from(a, 'hex'); const right = Buffer.from(b, 'hex');
  return left.length === right.length && timingSafeEqual(left, right);
};

const bearerFrom = (req: Request): string => {
  const match = /^Bearer\s+(.+)$/i.exec(req.header('authorization') || '');
  if (!match) throw new HttpError(401, 'Authentication required');
  return match[1];
};

const requestId = (_req: Request): string => randomBytes(12).toString('hex');

async function unityUser(token: string, submittedPlayerId: string): Promise<UnityUser> {
  const projectId = required('DEAD_CITY_UGS_PROJECT_ID');
  const response = await fetch(`https://player-auth.services.api.unity.com/v1/users/${encodeURIComponent(submittedPlayerId)}`, {
    headers: { Authorization: `Bearer ${token}`, ProjectId: projectId, 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new HttpError(401, 'Invalid Unity authentication');
  const user = await response.json() as UnityUser;
  if (user.id !== submittedPlayerId) throw new HttpError(403, 'Identity mismatch');
  return user;
}

async function googleIdentity(token: string): Promise<TokenPayload & { email: string; sub: string }> {
  const ticket = await new OAuth2Client().verifyIdToken({
    idToken: token,
    audience: required('DEAD_CITY_GOOGLE_CLIENT_ID').split(',').map(v => v.trim()).filter(Boolean),
  });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    throw new HttpError(401, 'A verified Google identity is required');
  }
  if (!payload.iat || Math.abs(Date.now() / 1000 - payload.iat) > 10 * 60) {
    throw new HttpError(401, 'A fresh Google identity token is required');
  }
  return payload as TokenPayload & { email: string; sub: string };
}

function assertLinked(user: UnityUser, googleSubject: string): void {
  const providers = required('DEAD_CITY_UNITY_GOOGLE_PROVIDER_IDS').split(',').map(v => v.trim());
  const linked = user.externalIds?.some(id => providers.includes(id.providerId) && id.externalId === googleSubject);
  if (!linked) throw new HttpError(403, 'Google identity is not linked to this Unity player');
}

async function rateLimit(client: PoolClient, playerId: string, emailHash: string, ip: string): Promise<void> {
  const rules: Array<[string, string, number, string]> = [
    ['player', digest(playerId), 3, '1 hour'], ['email', emailHash, 3, '1 hour'], ['ip', digest(ip), 10, '1 hour'],
  ];
  for (const [scope, valueHash, limit, window] of rules) {
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`${scope}:${valueHash}`]);
    const result = await client.query(
      `SELECT COUNT(*)::int AS count FROM dead_city_deletion_rate_events
       WHERE scope=$1 AND value_hash=$2 AND created_at > NOW() - $3::interval`, [scope, valueHash, window]);
    if (result.rows[0].count >= limit) throw new HttpError(429, 'Too many requests', '3600');
  }
  for (const [scope, valueHash] of rules) {
    await client.query('INSERT INTO dead_city_deletion_rate_events(scope,value_hash) VALUES($1,$2)', [scope, valueHash]);
  }
}

async function confirmRateLimit(client: PoolClient, playerId: string, ip: string): Promise<void> {
  const rules: Array<[string, string, number]> = [
    ['confirm_player', digest(playerId), 10], ['confirm_ip', digest(ip), 30],
  ];
  for (const [scope, valueHash, limit] of rules) {
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`${scope}:${valueHash}`]);
    const result = await client.query(
      `SELECT COUNT(*)::int AS count FROM dead_city_deletion_rate_events
       WHERE scope=$1 AND value_hash=$2 AND created_at > NOW() - INTERVAL '1 hour'`, [scope, valueHash]);
    if (result.rows[0].count >= limit) throw new HttpError(429, 'Too many requests', '3600');
    await client.query('INSERT INTO dead_city_deletion_rate_events(scope,value_hash) VALUES($1,$2)', [scope, valueHash]);
  }
}

async function sendCode(email: string, code: string): Promise<void> {
  const transport = nodemailer.createTransport({
    host: required('DEAD_CITY_SMTP_HOST'), port: Number(process.env.DEAD_CITY_SMTP_PORT || 587),
    secure: process.env.DEAD_CITY_SMTP_SECURE === 'true',
    auth: { user: required('DEAD_CITY_SMTP_USER'), pass: required('DEAD_CITY_SMTP_PASSWORD') },
  });
  await transport.sendMail({
    from: required('DEAD_CITY_EMAIL_FROM'), to: email,
    subject: 'Dead City account deletion code',
    text: `Your Dead City account deletion code is ${code}. It expires in 10 minutes. If you did not request deletion, ignore this email.`,
  });
}

const adminAuthorization = (): string => {
  const encoded = Buffer.from(`${required('DEAD_CITY_UGS_KEY_ID')}:${required('DEAD_CITY_UGS_SECRET_KEY')}`).toString('base64');
  return `Basic ${encoded}`;
};

async function ugsRequest(url: string, options: RequestInit = {}, missingIsSuccess = true): Promise<globalThis.Response> {
  const response = await fetch(url, { ...options, headers: { Authorization: adminAuthorization(), ...(options.headers || {}) } });
  if (response.ok || (missingIsSuccess && (response.status === 404 || response.status === 410))) return response;
  const retryAfter = response.headers.get('retry-after') || undefined;
  throw new HttpError(response.status === 429 ? 429 : 502, 'Unity service deletion failed', retryAfter);
}

async function deleteCloudData(playerId: string): Promise<void> {
  const project = encodeURIComponent(required('DEAD_CITY_UGS_PROJECT_ID'));
  const environment = encodeURIComponent(required('DEAD_CITY_UGS_ENVIRONMENT_ID'));
  const root = `https://services.api.unity.com/cloud-save/v1/data/projects/${project}/environments/${environment}/players/${encodeURIComponent(playerId)}`;
  await Promise.all(['items', 'public/items', 'protected/items', 'private/items'].map(path => ugsRequest(`${root}/${path}`, { method: 'DELETE' })));

  const filesRoot = `https://services.api.unity.com/cloud-save/v1/files/projects/${project}/environments/${environment}/players/${encodeURIComponent(playerId)}/items`;
  let next: string | undefined = filesRoot;
  while (next) {
    const response = await ugsRequest(next, {}, true);
    if (response.status === 404 || response.status === 410) break;
    const page = await response.json() as { results?: Array<{ key?: string; name?: string }>; links?: { next?: string } };
    await Promise.all((page.results || []).map(file => {
      const key = file.key || file.name;
      return key ? ugsRequest(`${filesRoot}/${encodeURIComponent(key)}`, { method: 'DELETE' }) : Promise.resolve(new globalThis.Response());
    }));
    next = page.links?.next;
  }
}

async function deleteLeaderboardScores(playerId: string): Promise<void> {
  const p = encodeURIComponent(required('DEAD_CITY_UGS_PROJECT_ID'));
  const e = encodeURIComponent(required('DEAD_CITY_UGS_ENVIRONMENT_ID'));
  await ugsRequest(`https://services.api.unity.com/leaderboards/v1/projects/${p}/environments/${e}/leaderboards/scores/players/${encodeURIComponent(playerId)}/purge`, { method: 'DELETE' });
}

async function deleteUnityAccount(playerId: string): Promise<void> {
  const project = encodeURIComponent(required('DEAD_CITY_UGS_PROJECT_ID'));
  await ugsRequest(`https://services.api.unity.com/player-identity/v1/projects/${project}/users/${encodeURIComponent(playerId)}`, { method: 'DELETE' });
}

export function createAccountDeletionRouter(pool: Pool): Router {
  const router = Router();

  router.use((req, res, next) => {
    if (process.env.NODE_ENV === 'production' && !req.secure) return res.status(400).json({ ok: false, message: 'HTTPS is required' });
    next();
  });

  router.post('/begin', async (req, res) => {
    const rid = requestId(req);
    try {
      const { playerId, googleIdToken } = req.body || {};
      if (typeof playerId !== 'string' || typeof googleIdToken !== 'string' || req.header('x-dead-city-google-token') !== googleIdToken) {
        throw new HttpError(400, 'Invalid request');
      }
      const [user, google] = await Promise.all([unityUser(bearerFrom(req), playerId), googleIdentity(googleIdToken)]);
      assertLinked(user, google.sub);
      const verificationId = randomBytes(32).toString('base64url');
      const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
      const emailHash = digest(google.email.toLowerCase());
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await rateLimit(client, playerId, emailHash, req.ip || req.socket.remoteAddress || 'unknown');
        await client.query(
          `INSERT INTO dead_city_account_deletions
           (verification_id,player_id,google_subject,email_hash,code_hash,expires_at)
           VALUES($1,$2,$3,$4,$5,NOW()+INTERVAL '10 minutes')`,
          [verificationId, playerId, google.sub, emailHash, codeDigest(verificationId, code)]);
        await client.query('COMMIT');
      } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
      try { await sendCode(google.email, code); }
      catch (error) {
        await pool.query('DELETE FROM dead_city_account_deletions WHERE verification_id=$1', [verificationId]);
        throw error;
      }
      res.status(200).json({ ok: true, verificationId, message: '' });
    } catch (error) { handleError(error, req, res, rid); }
  });

  router.post('/confirm', async (req, res) => {
    const rid = requestId(req);
    let row: DeletionRow | undefined;
    try {
      const { playerId, verificationId, code, googleIdToken } = req.body || {};
      if (![playerId, verificationId, code, googleIdToken].every(v => typeof v === 'string') || !/^\d{6}$/.test(code) || req.header('x-dead-city-google-token') !== googleIdToken) throw new HttpError(400, 'Invalid request');
      const found = await pool.query<DeletionRow>('SELECT * FROM dead_city_account_deletions WHERE verification_id=$1 AND player_id=$2', [verificationId, playerId]);
      row = found.rows[0];
      if (!row) throw new HttpError(404, 'Verification not found');
      if (row.status === 'completed') return res.status(200).json({ ok: true, message: '' });

      const google = await googleIdentity(googleIdToken);
      if (google.sub !== row.google_subject) throw new HttpError(403, 'Identity mismatch');
      // A deleting request may have already removed Authentication; its strong Google proof and
      // one-time verification secret allow an interrupted deletion to resume idempotently.
      if (row.status === 'pending') {
        const user = await unityUser(bearerFrom(req), playerId);
        assertLinked(user, google.sub);
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const locked = await client.query<DeletionRow>('SELECT * FROM dead_city_account_deletions WHERE verification_id=$1 FOR UPDATE', [verificationId]);
        row = locked.rows[0];
        if (row.status === 'completed') { await client.query('COMMIT'); return res.status(200).json({ ok: true, message: '' }); }
        await confirmRateLimit(client, playerId, req.ip || req.socket.remoteAddress || 'unknown');
        if (new Date(row.expires_at).getTime() < Date.now() || row.attempts >= MAX_ATTEMPTS || !row.code_hash) throw new HttpError(410, 'Verification expired');
        if (!safeEqual(row.code_hash, codeDigest(verificationId, code))) {
          await client.query('UPDATE dead_city_account_deletions SET attempts=attempts+1 WHERE verification_id=$1', [verificationId]);
          await client.query('COMMIT');
          throw new HttpError(400, 'Invalid verification code');
        }
        await client.query("UPDATE dead_city_account_deletions SET status='deleting' WHERE verification_id=$1", [verificationId]);
        await client.query('COMMIT');
      } catch (error) { await client.query('ROLLBACK').catch(() => undefined); throw error; } finally { client.release(); }

      const steps = row.deletion_steps || {};
      if (!steps.cloudSave) { await deleteCloudData(playerId); steps.cloudSave = true; await saveSteps(pool, verificationId, steps); }
      if (!steps.leaderboards) { await deleteLeaderboardScores(playerId); steps.leaderboards = true; await saveSteps(pool, verificationId, steps); }
      if (!steps.authentication) { await deleteUnityAccount(playerId); steps.authentication = true; await saveSteps(pool, verificationId, steps); }
      await pool.query(
        `UPDATE dead_city_account_deletions SET status='completed', completed_at=NOW(), code_hash=NULL,
         google_subject='', email_hash='', deletion_steps='{}'::jsonb WHERE verification_id=$1`, [verificationId]);
      res.status(200).json({ ok: true, message: '' });
    } catch (error) { handleError(error, req, res, rid); }
  });
  return router;
}

async function saveSteps(pool: Pool, verificationId: string, steps: Record<string, boolean>): Promise<void> {
  await pool.query('UPDATE dead_city_account_deletions SET deletion_steps=$2 WHERE verification_id=$1', [verificationId, JSON.stringify(steps)]);
}

function handleError(error: unknown, req: Request, res: ExpressResponse, rid: string): void {
  const known = error instanceof HttpError;
  const status = known ? error.status : 500;
  if (known && error.retryAfter) res.setHeader('Retry-After', error.retryAfter);
  // Deliberately exclude request bodies and identity fields.
  console.error(JSON.stringify({
    component: 'DeadCityDeletion', requestId: rid, status,
    category: known ? `HTTP_${status}` : 'INTERNAL_ERROR',
  }));
  res.status(status).json({ ok: false, message: status >= 500 ? 'Account deletion is temporarily unavailable' : (error as Error).message });
}

export { BASE };
