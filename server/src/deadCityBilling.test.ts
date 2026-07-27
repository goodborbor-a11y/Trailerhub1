import assert from 'assert';
import http from 'http';
import express from 'express';
import { Pool } from 'pg';
import { createBillingRateLimiter, createDeadCityBillingRouter, extractPurchaseToken } from './deadCityBilling';

assert.strictEqual(
  extractPurchaseToken(JSON.stringify({ Payload: JSON.stringify({ json: JSON.stringify({ purchaseToken: 'token-with-at-least-16-characters' }) }) })),
  'token-with-at-least-16-characters'
);
assert.strictEqual(extractPurchaseToken('{"unrelated":true}'), null);

async function request(port: number, headers: Record<string, string> = {}): Promise<number> {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path: '/google-play-purchases/verify', method: 'POST', headers }, res => {
      res.resume();
      res.on('end', () => resolve(res.statusCode || 0));
    });
    req.on('error', reject);
    req.end('{}');
  });
}

async function run(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '128kb' }));
  app.use(createDeadCityBillingRouter({} as Pool));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  assert(address && typeof address === 'object');
  try {
    for (let attempt = 0; attempt < 10; attempt += 1)
      assert.strictEqual(await request(address.port, { 'X-Forwarded-For': `198.51.100.${attempt}` }), 401);
    assert.strictEqual(await request(address.port, { 'X-Forwarded-For': '203.0.113.99' }), 429);
  } finally {
    server.close();
  }

  let now = 1_000;
  let passed = 0;
  const limiter = createBillingRateLimiter({ max: 2, windowMs: 1_000, now: () => now });
  const req = { ip: '192.0.2.1', socket: {} } as express.Request;
  const response = () => {
    const res = {
      setHeader: () => undefined,
      status: (code: number) => ({ json: () => code }),
    } as unknown as express.Response;
    return res;
  };
  limiter(req, response(), () => { passed += 1; });
  limiter(req, response(), () => { passed += 1; });
  limiter(req, response(), () => { passed += 1; });
  assert.strictEqual(passed, 2);
  now += 1_001;
  limiter(req, response(), () => { passed += 1; });
  assert.strictEqual(passed, 3);

  console.log('Dead City billing security tests passed.');
}

run().catch(error => {
  console.error(error instanceof Error ? error.message : 'Billing test failed');
  process.exit(1);
});
