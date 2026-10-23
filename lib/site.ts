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
  'Dán câu người nhà vừa nhắn — bố mẹ, mẹ chồng, vợ chồng, sếp — xem ý thật, mức căng thẳng và 3 câu trả lời cho êm chuyện. Không cần đăng nhập.';
