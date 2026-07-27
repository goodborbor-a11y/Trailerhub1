import { createHash, createPublicKey, KeyObject, randomUUID } from 'crypto';
import express, { NextFunction, Request, Response } from 'express';
import { GoogleAuth } from 'google-auth-library';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Pool } from 'pg';

const PACKAGE_NAME = 'com.rocktimemedia.deadcityapocalypse';
const UNITY_ISSUER = 'https://player-auth.services.api.unity.com';
const UNITY_JWKS_URL = `${UNITY_ISSUER}/.well-known/jwks.json`;
const ANDROID_PUBLISHER_SCOPE = 'https://www.googleapis.com/auth/androidpublisher';

export const DEAD_CITY_PRODUCTS = Object.freeze({
  deadcity_gems_50: { blueGems: 50, redGems: 0 },
  deadcity_blue_gems_medium: { blueGems: 650, redGems: 0 },
  deadcity_blue_gems_large: { blueGems: 1400, redGems: 0 },
  deadcity_red_gems_small: { blueGems: 0, redGems: 25 },
  deadcity_red_gems_medium: { blueGems: 0, redGems: 75 },
  deadcity_red_gems_large: { blueGems: 0, redGems: 170 },
});

type ProductId = keyof typeof DEAD_CITY_PRODUCTS;
type JsonObject = Record<string, unknown>;

interface VerifyBody {
  playerId?: unknown;
  packageName?: unknown;
  productId?: unknown;
  transactionId?: unknown;
  receipt?: unknown;
}

interface GoogleProductPurchaseV2 {
  purchaseStateContext?: { purchaseState?: string };
  productLineItem?: Array<{
    productId?: string;
    productOfferDetails?: {
      quantity?: number;
      refundableQuantity?: number;
      consumptionState?: string;
    };
  }>;
  obfuscatedExternalAccountId?: string;
}

interface UnityClaims extends JwtPayload {
  project_id?: string;
}

interface JwksResponse {
  keys?: Array<{ kid?: string; kty?: string; [key: string]: unknown }>;
}

let jwksCache = new Map<string, KeyObject>();
let jwksExpiresAt = 0;

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function isObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function maybeParseJson(value: string): unknown {
  try { return JSON.parse(value); } catch { return value; }
}

/** Extracts the Google purchase token from Unity IAP's nested receipt envelope. */
export function extractPurchaseToken(receipt: string): string | null {
  const queue: Array<{ value: unknown; depth: number }> = [{ value: maybeParseJson(receipt), depth: 0 }];
  const seen = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.depth > 6 || seen.has(current.value)) continue;
    if (typeof current.value === 'object' && current.value !== null) seen.add(current.value);

    if (typeof current.value === 'string') {
      const parsed = maybeParseJson(current.value);
      if (parsed !== current.value) queue.push({ value: parsed, depth: current.depth + 1 });
      continue;
    }
    if (Array.isArray(current.value)) {
      for (const item of current.value) queue.push({ value: item, depth: current.depth + 1 });
      continue;
    }
    if (!isObject(current.value)) continue;

    for (const [key, value] of Object.entries(current.value)) {
      if ((key === 'purchaseToken' || key === 'token') && typeof value === 'string' && value.length >= 16)
        return value;
      queue.push({ value, depth: current.depth + 1 });
    }
  }
  return null;
}

async function refreshUnityJwks(): Promise<void> {
  const response = await fetch(UNITY_JWKS_URL, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error('Unity signing keys unavailable');
  const payload = await response.json() as JwksResponse;
  const next = new Map<string, KeyObject>();
  for (const key of payload.keys || []) {
    if (typeof key.kid !== 'string' || key.kty !== 'RSA') continue;
    next.set(key.kid, createPublicKey({ key: key as any, format: 'jwk' }));
  }
  if (next.size === 0) throw new Error('Unity signing keys were empty');
  jwksCache = next;
  jwksExpiresAt = Date.now() + 8 * 60 * 60 * 1000;
}

async function getUnitySigningKey(kid: string): Promise<KeyObject> {
  if (Date.now() >= jwksExpiresAt || !jwksCache.has(kid)) await refreshUnityJwks();
  const key = jwksCache.get(kid);
  if (!key) throw new Error('Unknown Unity signing key');
  return key;
}

async function verifyUnityBearer(token: string): Promise<UnityClaims> {
  const projectId = process.env.DEAD_CITY_UNITY_PROJECT_ID;
  const environmentId = process.env.DEAD_CITY_UNITY_ENVIRONMENT_ID;
  const environmentName = process.env.DEAD_CITY_UNITY_ENVIRONMENT_NAME;
  if (!projectId || !environmentId || !environmentName)
    throw new Error('Unity verification is not configured');

  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || typeof decoded.header.kid !== 'string' || decoded.header.alg !== 'RS256')
    throw new Error('Invalid Unity access token');
  const key = await getUnitySigningKey(decoded.header.kid);
  const claims = jwt.verify(token, key, { algorithms: ['RS256'], issuer: UNITY_ISSUER }) as UnityClaims;
  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  const expectedAudience = [`upid:${projectId}`, `envName:${environmentName}`];
  expectedAudience.push(`envId:${environmentId}`);
  if (claims.project_id !== projectId || !expectedAudience.every(value => audience.includes(value)))
    throw new Error('Unity token is for another project or environment');
  if (!claims.sub) throw new Error('Unity token has no player identity');
  return claims;
}

async function getGooglePurchase(purchaseToken: string): Promise<GoogleProductPurchaseV2> {
  const keyFilename = process.env.DEAD_CITY_GOOGLE_SERVICE_ACCOUNT_FILE;
  if (keyFilename !== '/run/secrets/google-play-verifier.json')
    throw new Error('Google Play verification is not configured');
  const auth = new GoogleAuth({ keyFilename, scopes: [ANDROID_PUBLISHER_SCOPE] });
  const client = await auth.getClient();
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(PACKAGE_NAME)}/purchases/productsv2/tokens/${encodeURIComponent(purchaseToken)}`;
  const response = await client.request<GoogleProductPurchaseV2>({ url, method: 'GET', timeout: 10_000 });
  return response.data;
}

function getBearer(req: Request): string | null {
  const header = req.header('authorization');
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token || null;
}

function textField(value: unknown, maxLength: number): string | null {
  return typeof value === 'string' && value.length > 0 && value.length <= maxLength ? value : null;
}

type RateEntry = { count: number; resetAt: number };

export function createBillingRateLimiter(options: { windowMs?: number; max?: number; now?: () => number } = {}) {
  const windowMs = options.windowMs || 60_000;
  const max = options.max || 10;
  const now = options.now || Date.now;
  const entries = new Map<string, RateEntry>();

  return (req: Request, res: Response, next: NextFunction) => {
    const timestamp = now();
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    let entry = entries.get(key);
    if (!entry || timestamp >= entry.resetAt) {
      entry = { count: 0, resetAt: timestamp + windowMs };
      entries.set(key, entry);
    }
    entry.count += 1;
    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(Math.max(0, max - entry.count)));
    res.setHeader('RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));
    if (entries.size > 10_000) {
      for (const [candidate, value] of entries) if (timestamp >= value.resetAt) entries.delete(candidate);
    }
    if (entry.count > max) {
      res.setHeader('Retry-After', String(Math.max(1, Math.ceil((entry.resetAt - timestamp) / 1000))));
      console.warn(JSON.stringify({ component: 'DeadCityBilling', requestId: randomUUID(), category: 'RATE_LIMITED' }));
      return res.status(429).json({ ok: false, message: 'Too many verification attempts. Please retry later.' });
    }
    return next();
  };
}

class PurchaseOwnershipConflict extends Error {}

function safeCategory(error: unknown): string {
  if (error instanceof PurchaseOwnershipConflict) return 'OWNERSHIP_CONFLICT';
  const name = error instanceof Error ? error.name : '';
  if (name === 'AbortError' || name === 'TimeoutError' || name === 'GaxiosError') return 'UPSTREAM_UNAVAILABLE';
  return 'VERIFICATION_FAILED';
}

export function createDeadCityBillingRouter(pool: Pool): express.Router {
  const router = express.Router();
  router.use(createBillingRateLimiter());

  router.post('/google-play-purchases/verify', async (req: Request, res: Response) => {
    const requestId = randomUUID();
    res.setHeader('X-Request-ID', requestId);
    const bearer = getBearer(req);
    if (!bearer) return res.status(401).json({ ok: false, message: 'Authentication required.' });

    const body = (req.body || {}) as VerifyBody;
    const playerId = textField(body.playerId, 128);
    const packageName = textField(body.packageName, 200);
    const productId = textField(body.productId, 132);
    const transactionId = textField(body.transactionId, 512);
    const receipt = textField(body.receipt, 100_000);
    if (!playerId || !packageName || !productId || !transactionId || !receipt)
      return res.status(400).json({ ok: false, message: 'Incomplete purchase record.' });
    if (packageName !== PACKAGE_NAME || !(productId in DEAD_CITY_PRODUCTS))
      return res.status(400).json({ ok: false, message: 'Unknown app or product.' });

    try {
      const claims = await verifyUnityBearer(bearer);
      if (claims.sub !== playerId)
        return res.status(403).json({ ok: false, message: 'Player identity mismatch.' });

      const purchaseToken = extractPurchaseToken(receipt);
      if (!purchaseToken)
        return res.status(400).json({ ok: false, message: 'Google purchase token was missing.' });

      const googlePurchase = await getGooglePurchase(purchaseToken);
      const lines = googlePurchase.productLineItem || [];
      const line = lines[0];
      const details = line?.productOfferDetails;
      const expectedAccount = sha256(playerId);
      if (googlePurchase.purchaseStateContext?.purchaseState !== 'PURCHASED')
        return res.status(409).json({ ok: false, message: 'Purchase is not completed yet.' });
      if (lines.length !== 1 || line.productId !== productId || details?.quantity !== 1 ||
          details.refundableQuantity !== 1)
        return res.status(400).json({ ok: false, message: 'Google purchase details did not match.' });
      if (googlePurchase.obfuscatedExternalAccountId !== expectedAccount)
        return res.status(403).json({ ok: false, message: 'Purchase belongs to another player.' });

      const grant = DEAD_CITY_PRODUCTS[productId as ProductId];
      const grantId = sha256(purchaseToken);
      const playerHash = sha256(playerId);
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const inserted = await client.query(
          `INSERT INTO dead_city_google_play_purchases
             (purchase_token_hash, player_id, product_id, transaction_id, blue_gems, red_gems, state)
           VALUES ($1, $2, $3, $4, $5, $6, 'VERIFIED')
           ON CONFLICT (purchase_token_hash) DO NOTHING
           RETURNING purchase_token_hash`,
          [grantId, playerId, productId, transactionId, grant.blueGems, grant.redGems]
        );
        let alreadyProcessed = inserted.rowCount === 0;
        if (alreadyProcessed) {
          const existing = await client.query(
            `SELECT player_id, product_id, transaction_id, blue_gems, red_gems, state
               FROM dead_city_google_play_purchases WHERE purchase_token_hash = $1 FOR UPDATE`,
            [grantId]
          );
          const row = existing.rows[0];
          if (!row || row.player_id !== playerId || row.product_id !== productId || row.transaction_id !== transactionId ||
              row.blue_gems !== grant.blueGems || row.red_gems !== grant.redGems)
            throw new PurchaseOwnershipConflict('Purchase token ownership conflict');
          await client.query(
            `UPDATE dead_city_google_play_purchases
                SET verification_attempts = verification_attempts + 1, updated_at = NOW()
              WHERE purchase_token_hash = $1`,
            [grantId]
          );
        }
        await client.query('COMMIT');
        console.info(JSON.stringify({
          component: 'DeadCityBilling', requestId, purchaseHash: grantId,
          playerHash, productId, transition: alreadyProcessed ? 'VERIFIED_REPLAY' : 'VERIFIED',
        }));
        return res.json({
          ok: true,
          alreadyProcessed,
          message: alreadyProcessed ? 'Purchase was already verified.' : 'Purchase verified.',
          productId,
          transactionId,
          grantId,
          blueGems: grant.blueGems,
          redGems: grant.redGems,
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      // Never log bearer tokens, receipts, purchase tokens, or raw service-account errors.
      const category = safeCategory(error);
      console.error(JSON.stringify({ component: 'DeadCityBilling', requestId, category }));
      if (error instanceof PurchaseOwnershipConflict)
        return res.status(409).json({ ok: false, message: 'Purchase record conflicts with an existing verification.' });
      return res.status(503).json({ ok: false, message: 'Purchase verification is temporarily unavailable.' });
    }
  });

  return router;
}
