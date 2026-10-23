import type { NextConfig } from 'next';

/**
 * Security headers cho mọi route — bổ sung theo QA Portfolio audit #01
 * (2026-10-23): production trước đó chỉ có HSTS do Vercel cấp, thiếu các
 * header chống clickjacking / MIME-sniffing / rò referrer.
 * Permissions-Policy tắt các quyền app không dùng (app chỉ dán văn bản,
 * không camera/mic/định vị/thanh toán).
 */
const securityHeaders = [
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
