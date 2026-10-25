import type { Metadata, Viewport } from 'next';
import { Be_Vietnam_Pro, Fraunces } from 'next/font/google';
import RegisterServiceWorker from '@/components/dichbome/register-sw';
import { WebVitalsReporter } from '@/components/dichbome/web-vitals';
import { FAQS } from '@/lib/faq';
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from '@/lib/site';
import './globals.css';

const sans = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
  // PERF-08 (fix wave 3): KHÔNG preload font chữ thân — 4 weight × 2 subset
  // = 8 file preload (~73 KB) tranh băng thông với LCP trong khi font vẫn
  // được nạp ngay qua CSS cùng origin + display:swap. Chỉ font hiển thị
  // Fraunces (chữ ký thương hiệu ở sân khấu) giữ preload. Xem ADR-002.
  preload: false,
});

/* Display serif duy nhất của app (DESIGN.md): Fraunces variable, toàn
   dải trục wght (next/font không nhận literal '680' — type chỉ cho các
   bậc trăm hoặc 'variable'). Weight 680 được GHIM TƯỜNG MINH tại nơi
   dùng: class .font-display trong globals.css đặt font-weight: 680 và
   heading sân khấu khai thêm style 680 (REDESIGN-V4, TYPE-AND-ICON §1:
   680 là toạ độ thật trên trục variable; cấm 560/400 cho vai tuyên bố).
   Chỉ mở trục opsz, WONK/SOFT giữ mặc định 0. Cấm serif hệ thống: thiếu
   glyph tiền hợp tiếng Việt. */
const display = Fraunces({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-display',
  display: 'swap',
  axes: ['opsz'],
});

export const viewport: Viewport = {
  // Canvas trắng tuyệt đối của V4 (NEUTRAL-FIRST) — thanh trạng thái/
  // trình duyệt trên mobile theo canvas, không nhuộm seed.
  themeColor: '#FFFFFF',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  verification: {
    google: '4vR-FfACE45r_MqkVxeYtSg9ZY_VjsLS137PyDewq5E',
  },
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'giải mã gia đình',
    'dịch tiếng bố mẹ',
    'dịch ý thật tin nhắn',
    'giải mã tin nhắn',
    'hiểu ý bố mẹ',
    'hiểu ý bố mẹ qua tin nhắn',
    'tin nhắn bố mẹ',
    'mẹ chồng nàng dâu',
    'hiểu ý mẹ chồng',
    'tin nhắn vợ chồng',
    'cách trả lời tin nhắn bố mẹ',
    'gợi ý câu trả lời',
    'ứng dụng gia đình việt',
  ],
  alternates: {
    // SEO-04 (fix wave 3): canonical tuyệt đối. Next chuẩn hoá URL gốc
    // về dạng KHÔNG slash cuối (đã đo trên bản build: truyền vào có
    // slash, HTML ra không slash) — sitemap + JSON-LD đồng bộ về cùng
    // dạng này để mọi tín hiệu URL gốc khớp nhau byte-for-byte.
    canonical: `${SITE_URL}/`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    // SEO-04: og:url cùng dạng URL gốc như canonical + sitemap.
    url: `${SITE_URL}/`,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: SITE_TITLE,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/og.png'],
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/products/brand/dichbome-logo.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

/**
 * Dữ liệu có cấu trúc (JSON-LD) — chỉ khai đúng sự thật về app:
 * không rating, không giá, không review (app chưa từng công bố các số đó).
 */
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      // SEO-09 (fix wave 3): node WebSite — tín hiệu tên thứ ba (cùng
      // og:site_name + title/H1) để SEO-09b đối chiếu nhất quán được.
      '@type': 'WebSite',
      name: SITE_NAME,
      alternateName: 'dichbome',
      // SEO-04: cùng dạng URL gốc không slash như canonical/sitemap.
      url: SITE_URL,
      inLanguage: 'vi',
    },
    {
      '@type': 'WebApplication',
      name: SITE_NAME,
      alternateName: 'dichbome',
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      inLanguage: 'vi',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Any',
      // SEO-09: offers khai đúng sự thật — app miễn phí hoàn toàn, không
      // bán gì, không có gói trả phí (price 0).
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'VND' },
    },
    {
      // FAQPage phải khớp từng câu với section FAQ hiển thị trên trang chủ —
      // cả hai cùng đọc từ lib/faq.ts nên không thể lệch nhau.
      '@type': 'FAQPage',
      inLanguage: 'vi',
      mainEntity: FAQS.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${sans.variable} ${display.variable}`}>
      <body className="font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
        {children}
        <RegisterServiceWorker />
        <WebVitalsReporter />
      </body>
    </html>
  );
}
