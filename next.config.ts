import type { NextConfig } from 'next';

/**
 * Content-Security-Policy (SEC-02) — fix wave 3.
 * App phục vụ từ một origin duy nhất: trang tĩnh + 2 route handler API
 * cùng origin; font self-host qua next/font (file woff2 phát từ chính
 * origin); không script/ảnh/font bên thứ ba nào (kê khai đầy đủ ở
 * docs/THIRD-PARTIES.md).
 * - default-src 'self': mặc định khoá mọi nguồn ngoài.
 * - script-src 'self' 'unsafe-inline': 'unsafe-inline' là NGOẠI LỆ P-02
 *   ĐƯỜNG C ĐÃ ĐĂNG KÝ — Next static prerender nhúng inline bootstrap
 *   script (flight data) chứa BUILD_ID ngẫu nhiên của từng lần build;
 *   đường A (hash) đã thử bằng 2 lần build liên tiếp và KHÔNG khả thi
 *   (hash flight-data đổi theo build — bằng chứng trong hồ sơ), đường B
 *   (nonce) đòi dynamic rendering trái bản chất route tĩnh. Hồ sơ:
 *   docs/security/CSP-EXCEPTION-P02.md; sổ đăng ký:
 *   docs/security/EXCEPTION-REGISTRY.md (EXC-CSP-01, hết hạn 2027-01-21
 *   hoặc release kế tiếp — mốc sớm hơn). Test tests/csp.test.mjs đối
 *   chiếu header này với sổ đăng ký — lệch là fail.
 * - style-src 'self' 'unsafe-inline': React gắn style attribute inline
 *   (biến CSS --i cho stagger của phiếu giải mã) + Next chèn <style> khi
 *   prerender; CSS từ nguồn ngoài vẫn bị cấm. Ngoại lệ EXC-CSP-02.
 * - img-src 'self': ảnh tĩnh của chính app; app không dùng data:/blob:.
 * - font-src 'self': font next/font phát từ chính origin.
 * - connect-src 'self': UI chỉ fetch về chính origin (2 route API tích
 *   hợp; chế độ local chạy engine trên máy, không fetch).
 * - worker-src 'self': service worker viết tay (public/sw.js) chỉ từ
 *   origin này.
 * - manifest-src 'self'; object-src 'none'; base-uri 'self';
 *   form-action 'self'; frame-ancestors 'none' (đi cùng XFO DENY).
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self'",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

/**
 * Security headers cho mọi route — bổ sung theo QA Portfolio audit #01
 * (2026-10-23): production trước đó chỉ có HSTS do Vercel cấp, thiếu các
 * header chống clickjacking / MIME-sniffing / rò referrer.
 * Permissions-Policy tắt các quyền app không dùng (app chỉ dán văn bản,
 * không camera/mic/định vị/thanh toán).
 */
const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
];

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
