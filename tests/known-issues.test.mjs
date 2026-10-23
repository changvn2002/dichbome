// Known-issues quarantine — dichbome (Sprint 1, hạng mục C7).
// Mỗi test dưới đây TÁI HIỆN một bug/vấn đề đã đo được bởi worker độc lập và
// đang FAIL đúng như kỳ vọng. Chúng được đánh dấu `todo` kèm ID backlog để:
//   - cổng test (pnpm test) vẫn xanh cho các bất biến đã khoá ở baseline;
//   - bug không bị "đóng băng" thành chuẩn đúng — khi một mục được sửa ở
//     sprint sau, BỎ cờ todo của đúng test đó: test chuyển thành khóa hồi quy.
// TUYỆT ĐỐI không sửa assertion cho khớp output sai hiện tại.
// Nguồn bằng chứng gốc: tests-evidence/ (W1/W4), tests-ux/ (W3),
// ~/workspace/mini-apps/qa-reports/dichbome_w5_content_test.py (W5),
// ~/workspace/mini-apps/dichbome-seo-sprint1/seo_regression_test.py (W2).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  translateDichbome,
  normalizeVi as normalizeServer,
  DICHBOME_EXAMPLES,
} from '../lib/server/engine.ts';
import {
  translateParentMessage,
  normalizeVi as normalizeClient,
  PARENT_EXAMPLES,
} from '../components/dichbome/lib/translate.ts';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// ĐÃ SỬA ở Sprint 2 (S2 — biến thể theo vai gắn trên entry generic, 2026-10-24):
// bỏ cờ todo — test thành khoá hồi quy.
test('KI-C1: vai người yêu không được nhận output văn phong bố mẹ (rule generic rò)', () => {
  const r = translateDichbome({ message: 'Không sao đâu', speaker: 'lover', context: 'khac' });
  const all = [r.meaning, r.realWant, ...r.replies.map((x) => x.text)].join(' ');
  for (const marker of ['con lo', 'Con lớn rồi', 'để con gọi về']) {
    assert.ok(!all.includes(marker), `output lover chứa dấu vết văn phong bố mẹ: "${marker}"`);
  }
});

// ĐÃ SỬA ở fix wave 3 (CQ-14, 2026-10-23): bỏ cờ todo — test thành khoá hồi quy.
test('KI-PARITY-1: normalizeVi hai engine cho cùng một chuỗi', () => {
  for (const s of ['Mẹ ơi! Con về...', 'Tuỳ con!!!', 'Ăn cơm chưa?', 'ĐỪNG có về nữa...']) {
    assert.equal(normalizeServer(s), normalizeClient(s), `normalize lệch cho ${JSON.stringify(s)}`);
  }
});

// ĐÃ SỬA ở fix wave 3 (CQ-14, 2026-10-23): bỏ cờ todo — test thành khoá hồi quy.
test('KI-PARITY-2: cùng input, server và client fallback cho cùng meaning', () => {
  const cases = [
    { message: 'Tuỳ con', speaker: 'me', context: 'khac', cs: 'Mẹ', cc: 'Khác' },
    { message: 'Con bận', speaker: 'child', context: 'khac', cs: 'Con', cc: 'Khác' },
    { message: 'Mẹ ăn cơm rồi', speaker: 'me', context: 'suc-khoe', cs: 'Mẹ', cc: 'Sức khoẻ' },
    { message: 'Khi nào về quê?', speaker: 'me', context: 've-que', cs: 'Mẹ', cc: 'Về quê' },
    { message: 'Ừ', speaker: 'me', context: 'khac', cs: 'Mẹ', cc: 'Khác' },
  ];
  for (const c of cases) {
    const s = translateDichbome({ message: c.message, speaker: c.speaker, context: c.context });
    const cl = translateParentMessage({ message: c.message, speaker: c.cs, context: c.cc });
    assert.equal(s.meaning, cl.meaning, `meaning lệch cho "${c.message}"`);
  }
});

// ĐÃ SỬA ở fix wave 3 (CQ-14, 2026-10-23): bỏ cờ todo — test thành khoá hồi quy.
test('KI-PARITY-3: tập examples server và client giống hệt nhau', () => {
  assert.equal(DICHBOME_EXAMPLES.length, PARENT_EXAMPLES.length);
});

// ĐÃ SỬA ở fix wave 3 (2026-10-23): bỏ cờ todo — test thành khoá hồi quy.
test('KI-VAL-1: engine server tự chặn message > 500 ký tự như route', () => {
  assert.throws(
    () => translateDichbome({ message: 'a'.repeat(501), speaker: 'me', context: 'khac' }),
    /500/,
  );
});

// ĐÃ SỬA ở fix wave 3 (2026-10-23): bỏ cờ todo — test thành khoá hồi quy.
test('KI-VAL-2: engine client tự chặn message rỗng như local API', () => {
  assert.throws(() => translateParentMessage({ message: '   ', speaker: 'Mẹ', context: 'Khác' }));
});

test(
  'KI-PERF-1: JS first-load route / không vượt 170 KB gzip',
  { todo: 'Backlog C21/C23 — ngân sách hiệu năng W1 (tests-evidence/perf-budget.test.mjs)' },
  (t) => {
    const manifestPath = path.join(ROOT, '.next', 'build-manifest.json');
    const htmlPath = path.join(ROOT, '.next', 'server', 'app', 'index.html');
    if (!existsSync(manifestPath) || !existsSync(htmlPath)) {
      t.skip('chưa có artifact .next — chạy pnpm build trước');
      return;
    }
    const build = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const html = readFileSync(htmlPath, 'utf8');
    const polyfill = new Set(build.polyfillFiles ?? []);
    const scripts = [...html.matchAll(/src="(\/_next\/static\/chunks\/[^"]+\.js)"/g)].map(
      (m) => m[1],
    );
    const firstLoad = scripts.filter((u) => !polyfill.has(u.replace('/_next/', '')));
    const totalGz = firstLoad.reduce(
      (s, u) =>
        s + gzipSync(readFileSync(path.join(ROOT, '.next', u.replace('/_next/', '')))).length,
      0,
    );
    assert.ok(totalGz <= 170_000, `JS first-load gzip ${totalGz} B > 170,000 B`);
    assert.ok(statSync(htmlPath).size > 0);
  },
);

test(
  'KI-PERF-2: font preload không vượt 4 file / 60 KB',
  {
    todo: 'Backlog C21 thu hẹp — preload:false cho font không dùng trong UI render (Outfit/Playfair)',
  },
  (t) => {
    const htmlPath = path.join(ROOT, '.next', 'server', 'app', 'index.html');
    if (!existsSync(htmlPath)) {
      t.skip('chưa có artifact .next — chạy pnpm build trước');
      return;
    }
    const html = readFileSync(htmlPath, 'utf8');
    const preloads = [
      ...html.matchAll(/rel="preload" href="(\/_next\/static\/media\/[^"]+\.woff2)"/g),
    ].map((m) => m[1]);
    const total = preloads.reduce(
      (s, u) => s + statSync(path.join(ROOT, '.next', u.replace('/_next/', ''))).size,
      0,
    );
    assert.ok(preloads.length <= 4, `preload ${preloads.length} file font > 4`);
    assert.ok(total <= 60_000, `font preload ${total} B > 60,000 B`);
  },
);
