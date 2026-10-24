/**
 * Sinh các bản PNG phục vụ SEO/PWA từ SVG brand CHÍNH THỨC (REDESIGN-V4)
 * trong public/products/brand/ — assets chép nguyên bản từ hồ sơ
 * redesign-v4/dichbome/assets/, artwork KHÔNG sửa:
 *   public/og.png                        1200×630 — Open Graph (VISUAL-LAYER §5)
 *   public/icons/icon-192.png            192×192  — icon PWA (từ app-icon.svg)
 *   public/icons/icon-512.png            512×512  — icon PWA
 *   public/icons/icon-maskable-512.png   512×512  — maskable (app-icon là tile
 *                                        đen full-bleed, mark đã ở 0,8× trong
 *                                        vùng an toàn — dùng nguyên bản)
 *   public/icons/apple-touch-icon.png    180×180  — iOS (nguyên bản app-icon)
 *
 * OG theo VISUAL-LAYER §5: nền đen tuyệt đối, hero biến thể tối (phiến A
 * stroke trắng trên đen + counter seed), tối đa 3 chấm cyan r=6 dọc cạnh
 * trên, lockup với wordmark đổi sang trắng CHỈ ở bản OG (wordmark là chữ —
 * trên nền đen phải là trắng/trung tính theo §5; file lockup gốc giữ mực đen).
 *
 * Cách chạy (cần @resvg/resvg-js — tool sinh ảnh một lần, KHÔNG phải
 * dependency runtime nên không nằm trong package.json):
 *   RESVG_DIR=~/workspace/mini-apps/resvg-tool node scripts/generate-brand-pngs.mjs
 * Nếu đã cài @resvg/resvg-js ngay trong repo thì: node scripts/generate-brand-pngs.mjs
 */
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const anchor = process.env.RESVG_DIR
  ? path.join(process.env.RESVG_DIR, 'package.json')
  : path.join(root, 'package.json');
const { Resvg } = createRequire(anchor)('@resvg/resvg-js');

function readBrand(file) {
  return readFileSync(path.join(root, 'public/products/brand', file), 'utf8');
}

/** Chèn toạ độ/kích thước vào thẻ <svg> gốc để nhúng nguyên bản artwork vào một khung lớn hơn. */
function nest(svg, { x, y, width, height }) {
  return svg.replace('<svg ', `<svg x="${x}" y="${y}" width="${width}" height="${height}" `);
}

function render(svg, width, outFile) {
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: { loadSystemFonts: false },
  })
    .render()
    .asPng();
  const out = path.join(root, 'public', outFile);
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, png);
  console.log(`✓ ${outFile} (${png.length} bytes)`);
}

const appIcon = readBrand('dichbome-app-icon.svg');
const hero = readBrand('dichbome-hero-stage.svg');
const lockup = readBrand('dichbome-wordmark.svg');

// Icons: nguyên bản app-icon (mark seed trên tile đen) ở mọi kích thước.
render(appIcon, 192, 'icons/icon-192.png');
render(appIcon, 512, 'icons/icon-512.png');
render(appIcon, 512, 'icons/icon-maskable-512.png');
render(appIcon, 180, 'icons/apple-touch-icon.png');

// OG 1200×630 (VISUAL-LAYER §5): nền đen; hero biến thể tối = phiến của
// hero-stage được vẽ lại trên đen (phiến A stroke trắng, phiến B stroke
// trắng nền trong suốt, counter giữ seed) chiếm vùng phải-trên; 3 chấm
// cyan r=6 dọc cạnh trên; lockup (wordmark trắng) ở góc dưới-trái.
const ogHeroDark = hero
  .replaceAll('fill="#FFFFFF"', 'fill="none"')
  .replaceAll('fill="#F5F5F5"', 'fill="none"')
  .replaceAll('stroke="#212121"', 'stroke="#FFFFFF"')
  .replaceAll('fill="#212121"', 'fill="#FFFFFF"');
const ogLockup = lockup.replaceAll('fill="#000000"', 'fill="#FFFFFF"');
render(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">` +
    `<rect width="1200" height="630" fill="#000000"/>` +
    `<circle cx="72" cy="36" r="6" fill="#25F4EE"/>` +
    `<circle cx="108" cy="36" r="6" fill="#25F4EE"/>` +
    `<circle cx="144" cy="36" r="6" fill="#25F4EE"/>` +
    nest(ogHeroDark, { x: 330, y: 84, width: 780, height: 234 }) +
    nest(ogLockup, { x: 72, y: 420, width: 660, height: 125 }) +
    `</svg>`,
  1200,
  'og.png',
);

if (!existsSync(path.join(root, 'public/og.png'))) {
  throw new Error('og.png was not written');
}
console.log('Done — brand artwork was only scaled/composited, never modified.');
