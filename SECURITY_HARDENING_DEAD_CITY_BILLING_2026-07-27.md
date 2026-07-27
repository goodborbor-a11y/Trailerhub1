# Dead City billing verifier hardening — 2026-07-27

## Applied server controls

- PostgreSQL has no host-published port. The backend uses `postgres:5432` on the private Compose network.
- Backend remains bound to `127.0.0.1:3001`.
- Adminer is disabled by default with the `tools` profile and, if explicitly enabled, binds only to `127.0.0.1:8080`.
- Production Compose variables use required-value substitutions; database/JWT fallback credentials were removed.
- Backend startup exits with one generic configuration message when required production configuration is missing or the JWT secret is weak.
- Google credentials are accepted only from `/run/secrets/google-play-verifier.json`. Inline JSON/base64 credential support was removed.
- The Unity project ID, environment ID, and environment name are all mandatory. Compose derives the verifier environment ID from `DEAD_CITY_UGS_ENVIRONMENT_ID`, preventing drift.
- JSON requests are capped at 128 KiB and oversized requests receive generic HTTP 413 JSON.
- The billing endpoint has a process-local 10 requests/minute limiter before authentication/JWKS/Google work and a dedicated Nginx limit.
- Cloudflare source ranges are trusted only for `CF-Connecting-IP`; Nginx overwrites `X-Forwarded-For` for billing requests.
- Logs contain only correlation IDs, hashes, product/state transitions, and generic categories. Request bodies and credentials are not logged.
- The ledger now supports `VERIFIED`, `GRANTED`, `CONSUMED`, `REFUNDED`, and `VOIDED` states with timestamps, attempt counters, safe error categories, constraints, and indexes.
- The existing account-deletion router was restored after the audit found a pre-existing 404 regression.
- `.env*` and the verifier credential filename are excluded from Git and Docker build contexts. `.env.example` remains allowed.

## Fulfillment safety gate

This VPS has no legitimate Unity Economy, Cloud Code, or other authoritative wallet-write API. Consequently:

- no currency grant was implemented;
- no Google consume call was implemented;
- no claim is made that duplicate delivery produces exactly one authoritative grant;
- the existing Unity-compatible response contract and client-confirmation path are preserved;
- purchases remain in `VERIFIED` until an authoritative, idempotent wallet operation exists.

Required dependency: provide an owner-approved server credential and documented UGS wallet mutation API with an idempotency key. The future order must be durable authoritative grant, commit `GRANTED`, retryable Google consumption, then commit `CONSUMED`. A crash after grant must reuse the same idempotency key and never grant twice.

## Manual Cloudflare follow-up

No Cloudflare account change was made from the VPS. Recommended rate-limiting rule:

- Expression: `(http.request.method eq "POST" and http.request.uri.path eq "/api/dead-city/google-play-purchases/verify")`
- Characteristic: client IP
- Threshold: 10 requests per 60 seconds
- Mitigation timeout: 60 seconds
- Action: block with HTTP 429
- Do not include Authorization headers or request bodies in logs.

## RTDN and voided-purchase follow-up

No Google Cloud or Play Console state was changed.

1. Create a dedicated Pub/Sub topic and subscription in the owner-approved Google Cloud project.
2. Grant the Google Play notification service account publisher permission only on that topic.
3. Link the topic under Play Console monetization Real-time Developer Notifications.
4. Implement an authenticated subscription consumer that stores the Pub/Sub message ID idempotently, fetches authoritative purchase state from Google, and transitions matching ledger rows to `REFUNDED` or `VOIDED`.
5. Add a scheduled Voided Purchases API reconciliation job to recover missed notifications.
6. Alert on unknown product/package IDs, unmatched token hashes, repeated delivery, and consumer backlog.

## Monitoring and retention

- Retain sanitized application/security logs for 30 days unless a shorter legal policy applies.
- Alert on sustained rate limiting, repeated upstream verification failures, ownership conflicts, invalid product/package attempts, and RTDN backlog.
- Never log bearer tokens, receipts, purchase tokens, service-account errors, email codes, or request bodies.

## 90-day service-account key rotation

1. Create a replacement key without disabling the active key.
2. Install it as `/root/.config/dead-city/google-play-verifier.json` with root ownership and mode 600.
3. Recreate only the backend and verify a sanitized Google API call/negative endpoint behavior.
4. Disable the old key and monitor verification errors.
5. Delete the old key after the monitoring window succeeds.
6. Never place either key in Git, `.env`, archives, chat, or Docker build context.

## SSH and host hardening gate

Read-only audit findings:

- UFW is inactive.
- Root SSH and password authentication are enabled.
- Public listeners also exist on 8000 and 9443 (outside this Compose project, apparently management tooling).
- fail2ban is not installed.

Do not change SSH access yet. Owner-confirmed sequence:

1. Provide the intended non-root deployment username and public SSH key.
2. Create the user, install the key, grant narrowly scoped sudo/deployment permissions, and install/configure fail2ban.
3. Add an inbound allowlist for approved SSH source(s), 80, and 443; decide explicitly whether management ports 8000/9443 should be removed or restricted.
4. Owner verifies the new key login and sudo in a second live session.
5. Only after explicit confirmation, disable root/password SSH and reload SSH safely.

## Backup and rollback

Backups (mode 600 under a mode-700 directory):

`/root/trailerhub_backups/20260727T150533Z-billing-hardening/`

Emergency live-file rollback (restores the pre-hardening files, removes newly restored/test sources, restores the prior `.env.save.1` mode, and rebuilds affected services):

```bash
cp -a /root/trailerhub_backups/20260727T150533Z-billing-hardening/live/. /root/trailerhub/ && rm -f /root/trailerhub/server/src/account-deletion.ts /root/trailerhub/server/src/deadCityBilling.test.ts && chmod 644 /root/trailerhub/.env.save.1 && cd /root/trailerhub && docker compose up -d --build --force-recreate postgres backend && docker exec movietrailers-nginx nginx -t && docker exec movietrailers-nginx nginx -s reload
```

The additive ledger migration is intentionally not destructively rolled back. Reverting it requires a separately reviewed data migration.

## Play Console state

All six products remain Draft. Unity purchasing remains disabled. No product activation or Play Console state change was performed.
