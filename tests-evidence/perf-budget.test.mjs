/**
 * tests-evidence/perf-budget.test.mjs — W1 (hiệu năng), Sprint 1 dichbome.
 *
 * Test BẰNG CHỨNG (không phải test sản phẩm): mỗi test khẳng định một ngân sách
 * hiệu năng định lượng. Test FAIL = tái hiện được vấn đề kèm số đo thật in ra
 * stdout. Chạy:  node --test tests-evidence/perf-budget.test.mjs
 * Đọc artifact build có sẵn ở .next/ (build 2026-10-23) + source — không sửa
 * code sản phẩm, không cần mạng.
 *
 * Nguồn ngân sách:
 * - Font preload: web.dev "preload critical fonts only" — chỉ font cho nội dung
 *   above-the-fold mới nên preload; >4 file preload tranh băng thông với LCP.
 * - JS first-load: ngân sách đội 170 KB gzip cho route / (tham chiếu web.dev /
 *   HTTP Archive performance budgets cho app nội dung nhẹ).
 * - FAQ triplication: nội dung tĩnh không nên xuất hiện >2 lần trong HTML
 *   (1 DOM hiển thị + tối đa 1 JSON-LD); bản sao thứ 3 là RSC flight payload.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync, readdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const NEXT = path.join(ROOT, '.next');
const html = readFileSync(path.join(NEXT, 'server/app/index.html'), 'utf8');

function bytes(p) {
  return statSync(p).size;
}
function gz(p) {
  return gzipSync(readFileSync(p)).length;
}

test('font preload: số file woff2 được preload <= 4', () => {
  const preloads = [
    ...html.matchAll(/rel="preload" href="(\/_next\/static\/media\/[^"]+\.woff2)"/g),
  ].map((m) => m[1]);
  console.log(`[evidence] preloaded font files = ${preloads.length}`);
  assert.ok(preloads.length <= 4, `preload ${preloads.length} fonts > ngân sách 4`);
});

test('font preload: tổng bytes font preload <= 60 KB', () => {
  const preloads = [
    ...html.matchAll(/rel="preload" href="(\/_next\/static\/media\/[^"]+\.woff2)"/g),
  ].map((m) => m[1]);
  const total = preloads.reduce((s, u) => s + bytes(path.join(NEXT, u.replace('/_next/', ''))), 0);
  console.log(`[evidence] preloaded font bytes = ${total}`);
  assert.ok(total <= 60_000, `font preload ${total} B > ngân sách 60,000 B`);
});

test('fonts: tổng số file woff2 build ra <= 12 và tổng bytes <= 150 KB', () => {
  const media = path.join(NEXT, 'static/media');
  const fonts = readdirSync(media).filter((f) => f.endsWith('.woff2'));
  const total = fonts.reduce((s, f) => s + bytes(path.join(media, f)), 0);
  console.log(`[evidence] woff2 files = ${fonts.length}, total bytes = ${total}`);
  assert.ok(fonts.length <= 12, `${fonts.length} font files > ngân sách 12`);
  assert.ok(total <= 150_000, `font bytes ${total} > ngân sách 150,000`);
});

test('JS first-load route / (gzip, trừ polyfill nomodule) <= 170 KB', () => {
  const build = JSON.parse(readFileSync(path.join(NEXT, 'build-manifest.json'), 'utf8'));
  const polyfill = new Set(build.polyfillFiles ?? []);
  const scripts = [...html.matchAll(/src="(\/_next\/static\/chunks\/[^"]+\.js)"/g)].map(
    (m) => m[1],
  );
  const firstLoad = scripts.filter((u) => !polyfill.has(u.replace('/_next/', '')));
  const totalRaw = firstLoad.reduce(
    (s, u) => s + bytes(path.join(NEXT, u.replace('/_next/', ''))),
    0,
  );
  const totalGz = firstLoad.reduce((s, u) => s + gz(path.join(NEXT, u.replace('/_next/', ''))), 0);
  console.log(
    `[evidence] first-load scripts = ${firstLoad.length}, raw = ${totalRaw} B, gzip = ${totalGz} B`,
  );
  assert.ok(totalGz <= 170_000, `JS first-load gzip ${totalGz} B > ngân sách 170,000 B`);
});

test('route / không được là Client Component toàn trang khi chứa section tĩnh (InfoSections)', () => {
  const page = readFileSync(path.join(ROOT, 'app/page.tsx'), 'utf8');
  console.log(
    `[evidence] app/page.tsx starts with 'use client': ${page.trimStart().startsWith("'use client'")}; imports InfoSections: ${page.includes('InfoSections')}`,
  );
  assert.ok(
    !(page.trimStart().startsWith("'use client'") && page.includes('InfoSections')),
    'page.tsx là use client + render InfoSections tĩnh => code/strings của section tĩnh bị đẩy vào client bundle',
  );
});

test('nội dung FAQ không xuất hiện quá 2 lần trong HTML prerender (DOM + JSON-LD là đủ)', () => {
  const faqSrc = readFileSync(path.join(ROOT, 'lib/faq.ts'), 'utf8');
  const questions = [...faqSrc.matchAll(/question:\s*'([^']+)'/g)].map((m) => m[1]);
  assert.ok(questions.length >= 3, 'cần đọc được câu hỏi FAQ từ lib/faq.ts');
  for (const q of questions) {
    const n = html.split(q).length - 1;
    console.log(`[evidence] occurrences of "${q.slice(0, 32)}..." in HTML = ${n}`);
    assert.ok(n <= 2, `FAQ "${q}" xuất hiện ${n} lần > 2 (DOM + JSON-LD + RSC flight)`);
  }
});

test('API examples (dữ liệu tĩnh) phải có cache header tĩnh hoặc app không fetch lại lúc mount', () => {
  const route = readFileSync(
    path.join(ROOT, 'app/api/products/dichbome/examples/route.ts'),
    'utf8',
  );
  const app = readFileSync(path.join(ROOT, 'components/dichbome/app.tsx'), 'utf8');
  const routeHasCache = /cache-control|Cache-Control|force-static|revalidate/.test(route);
  const appFetchesOnMount = /\.examples\(\)/.test(app);
  console.log(
    `[evidence] examples route has cache config: ${routeHasCache}; app fetches .examples() on mount: ${appFetchesOnMount}`,
  );
  assert.ok(
    routeHasCache || !appFetchesOnMount,
    'route examples tĩnh không khai cache, trong khi app vẫn fetch lúc mount (thêm 1 round-trip sau hydrate)',
  );
});
