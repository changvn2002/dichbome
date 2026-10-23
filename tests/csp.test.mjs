// SEC-02 header-assertion (fix wave 3, theo mẫu lib/csp.spec.ts của chiatien):
// CSP khai trong next.config.ts phải khớp HỒ SƠ đã đăng ký —
// docs/security/CSP-EXCEPTION-P02.md (đường C) + sổ đăng ký
// docs/security/EXCEPTION-REGISTRY.md. Lệch directive, xuất hiện token ngoài
// hồ sơ, hoặc ngoại lệ hết hạn mà chưa gia hạn kèm bằng chứng mới -> fail
// (đúng quy định "hết hạn = quay về FAIL" của checklist).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import nextConfig from '../next.config.ts';

function parseCsp(csp) {
  const map = new Map();
  for (const part of csp.split(';')) {
    const tokens = part.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) continue;
    map.set(tokens[0], tokens.slice(1));
  }
  return map;
}

function loadRegistry() {
  const text = readFileSync(
    new URL('../docs/security/EXCEPTION-REGISTRY.md', import.meta.url),
    'utf8',
  );
  const entries = [];
  const re = /^(\S+) \| directive: (\S+) \| token: (\S+) \| expires: (\d{4}-\d{2}-\d{2})$/gm;
  let m;
  while ((m = re.exec(text)) !== null) {
    entries.push({ id: m[1], directive: m[2], token: m[3], expires: m[4] });
  }
  return entries;
}

async function cspDirectives() {
  const rules = await nextConfig.headers();
  const rule = rules.find((r) => r.source === '/:path*');
  const header = rule?.headers.find((h) => h.key === 'Content-Security-Policy');
  assert.ok(header, 'Không tìm thấy header Content-Security-Policy trong next.config');
  return parseCsp(header.value);
}

test('csp: các directive nền ở mức chặt nhất theo checklist', async () => {
  const csp = await cspDirectives();
  assert.deepEqual(csp.get('default-src'), ["'self'"]);
  assert.deepEqual(csp.get('object-src'), ["'none'"]);
  assert.deepEqual(csp.get('base-uri'), ["'self'"]);
  assert.deepEqual(csp.get('frame-ancestors'), ["'none'"]);
  assert.deepEqual(csp.get('connect-src'), ["'self'"]);
  assert.deepEqual(csp.get('img-src'), ["'self'"]);
  assert.deepEqual(csp.get('font-src'), ["'self'"]);
});

test("csp: script-src không chứa 'unsafe-eval', *, data: và không origin ngoài", async () => {
  const csp = await cspDirectives();
  const scriptSrc = csp.get('script-src') ?? [];
  assert.ok(!scriptSrc.includes("'unsafe-eval'"));
  assert.ok(!scriptSrc.includes('*'));
  assert.ok(!scriptSrc.includes('data:'));
  for (const token of scriptSrc) {
    assert.ok(["'self'", "'unsafe-inline'"].includes(token), `token lạ trong script-src: ${token}`);
  }
});

test("csp: mọi 'unsafe-inline' đều có mục sổ đăng ký chưa hết hạn", async () => {
  const csp = await cspDirectives();
  const registry = loadRegistry();
  assert.ok(registry.length > 0, 'sổ đăng ký ngoại lệ trống');
  const today = new Date().toISOString().slice(0, 10);
  for (const directive of ['script-src', 'style-src']) {
    const tokens = csp.get(directive) ?? [];
    if (!tokens.includes("'unsafe-inline'")) continue;
    const entry = registry.find((e) => e.directive === directive && e.token === "'unsafe-inline'");
    assert.ok(entry, `${directive} dùng 'unsafe-inline' nhưng sổ đăng ký không có mục`);
    assert.ok(
      entry.expires >= today,
      `ngoại lệ ${entry.id} đã hết hạn ${entry.expires} — gia hạn kèm bằng chứng mới hoặc đóng ngoại lệ`,
    );
  }
});
