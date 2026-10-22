/**
 * Sinh các bản PNG phục vụ SEO/PWA từ SVG brand CHÍNH THỨC trong public/products/brand/:
 *   public/og.png                        1200×630 — ảnh Open Graph / Twitter card
 *   public/icons/icon-192.png            192×192  — icon PWA (nền trong suốt)
 *   public/icons/icon-512.png            512×512  — icon PWA (nền trong suốt)
 *   public/icons/icon-maskable-512.png   512×512  — icon maskable (logo 80% trên nền kem)
 *   public/icons/apple-touch-icon.png    180×180  — icon iOS (logo 88% trên nền kem)
 *
 * Nguyên tắc brand (xem BRAND.md): artwork KHÔNG bị sửa — không đổi màu, không vẽ lại,
 * không cắt xén. Script chỉ (1) raster hoá nguyên bản SVG ở kích thước đích, và
 * (2) khi nền tảng bắt buộc nền đục (maskable, iOS), đặt nguyên bản logo vào giữa
 * một nền kem #FAF6EF (màu nền app). Riêng og.png: banner chính thức 1600×900 được
 * thu nguyên tỉ lệ vào khung 1200×630, phần thừa hai bên là đúng màu nền #F6F1E7
 * mà banner tự vẽ — không crop mất chi tiết nào của tranh.
 *
 * Cách chạy (cần @resvg/resvg-js — chỉ là tool sinh ảnh một lần, KHÔNG phải
 * dependency runtime của app nên không nằm trong package.json):
 *   mkdir -p /tmp/resvg && cd /tmp/resvg && npm init -y && npm i @resvg/resvg-js
 *   RESVG_DIR=/tmp/resvg node scripts/generate-brand-pngs.mjs
 * Nếu đã cài @resvg/resvg-js ngay trong repo thì chỉ cần: node scripts/generate-brand-pngs.mjs
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

const CREAM = '#FAF6EF'; // nền app (BRAND.md) — nền bắt buộc cho icon maskable/iOS
const BANNER_BG = '#F6F1E7'; // màu rect nền mà banner chính thức tự vẽ

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

const logo = readBrand('dichbome-logo.svg');
const banner = readBrand('dichbome-banner.svg');

// Icon PWA thường: raster nguyên bản logo, giữ nền trong suốt.
render(logo, 192, 'icons/icon-192.png');
render(logo, 512, 'icons/icon-512.png');

// Icon maskable 512: logo chiếm 80% trong vùng an toàn, trên nền kem.
render(
  `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">` +
    `<rect width="512" height="512" fill="${CREAM}"/>` +
    nest(logo, { x: 51, y: 51, width: 410, height: 410 }) +
    `</svg>`,
  512,
  'icons/icon-maskable-512.png',
);

// Apple touch icon 180: iOS không hỗ trợ nền trong suốt nên cũng đặt trên nền kem, logo 88%.
render(
  `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">` +
    `<rect width="180" height="180" fill="${CREAM}"/>` +
    nest(logo, { x: 11, y: 11, width: 158, height: 158 }) +
    `</svg>`,
  180,
  'icons/apple-touch-icon.png',
);

// OG 1200×630: banner 1600×900 thu nguyên tỉ lệ theo chiều cao (×0.7 = 1120×630),
// căn giữa trên nền đúng màu banner tự vẽ — không crop.
render(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">` +
    `<rect width="1200" height="630" fill="${BANNER_BG}"/>` +
    nest(banner, { x: 40, y: 0, width: 1120, height: 630 }) +
    `</svg>`,
  1200,
  'og.png',
);

if (!existsSync(path.join(root, 'public/og.png'))) {
  throw new Error('og.png was not written');
}
console.log('Done — brand artwork was only scaled/composited, never modified.');
