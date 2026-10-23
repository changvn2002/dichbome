// PERF-08 — kiểm ngân sách JS first-load sau build (mẫu chiatien).
// Đọc perf-budget.json, tính tổng gzip của các <script src> trong
// .next/server/app/index.html TRỪ polyfill nomodule (đúng định nghĩa
// "first-load" của bộ bằng chứng hiệu năng tests-evidence/) và fail
// nếu vượt `budgetBytes`. Chạy trong CI sau `pnpm build`.
import { readFileSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const root = process.cwd();
const config = JSON.parse(readFileSync(join(root, 'perf-budget.json'), 'utf8'));
const htmlPath = join(root, '.next/server/app/index.html');

if (!existsSync(htmlPath)) {
  console.error(
    'check-bundle-budget: .next/server/app/index.html không tồn tại — chạy `pnpm build` trước.',
  );
  process.exit(1);
}

const html = readFileSync(htmlPath, 'utf8');
const build = JSON.parse(readFileSync(join(root, '.next/build-manifest.json'), 'utf8'));
const polyfill = new Set(build.polyfillFiles ?? []);
const srcs = [
  ...new Set([...html.matchAll(/<script[^>]+src="(\/_next\/[^"]+\.js)"/g)].map((m) => m[1])),
].filter((u) => !polyfill.has(u.replace('/_next/', '')));

let total = 0;
for (const src of srcs) {
  const file = join(root, '.next', src.replace('/_next/', ''));
  total += gzipSync(readFileSync(file), { level: 9 }).length;
}

console.log(
  `first-load JS: ${total} bytes gzip (${srcs.length} script) — ngân sách Tier ${config.tier}: ${config.budgetBytes} bytes`,
);
if (total > config.hardCapBytes) {
  console.error(`FAIL: vượt hard cap ${config.hardCapBytes} bytes của checklist PERF-08.`);
  process.exit(1);
}
if (total > config.budgetBytes) {
  console.error(
    `FAIL: vượt ngân sách đã khai ${config.budgetBytes} bytes — tăng ngân sách phải qua ADR mới (khoá tăng trưởng ${config.growthLock}).`,
  );
  process.exit(1);
}
console.log('OK: trong ngân sách.');
