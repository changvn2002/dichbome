/**
 * Thông tin site dùng chung cho SEO/PWA: layout (metadata, JSON-LD), robots.ts,
 * sitemap.ts, manifest.ts cùng đọc từ đây để không lệch nhau.
 *
 * NEXT_PUBLIC_SITE_URL — URL gốc của bản production (không có slash cuối).
 * Mặc định là domain Vercel dự kiến của repo này; khi có domain chính thức,
 * chỉ cần đặt biến môi trường lúc deploy, không phải sửa code.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dichbome.vercel.app').replace(
  /\/+$/,
  '',
);

export const SITE_NAME = 'Giải Mã Gia Đình';

export const SITE_TITLE = 'Giải Mã Gia Đình — Dịch ý thật sau tin nhắn của người thân';

export const SITE_DESCRIPTION =
  'Dán bất kỳ câu nào người nhà nhắn — bố mẹ, con cái, mẹ chồng, nàng dâu, vợ chồng, sếp — app dịch ra ý thật, đo mức độ căng thẳng và gợi ý sẵn 3 câu trả lời cho êm chuyện. Engine rule-based tiếng Việt, không cần đăng nhập.';
