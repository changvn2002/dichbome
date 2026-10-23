import type { Metadata, Viewport } from 'next';
import { Be_Vietnam_Pro, Outfit, Playfair_Display } from 'next/font/google';
import { FAQS } from '@/lib/faq';
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from '@/lib/site';
import './globals.css';

const sans = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const display = Outfit({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

/* Serif có đủ dấu tiếng Việt (subset vietnamese) cho tiêu đề.
   Tuyệt đối không dùng Georgia/Times hệ thống: thiếu glyph tiền tố hợp,
   dấu tiếng Việt bị chồng/lệch trên Windows. */
const serifVn = Playfair_Display({
  subsets: ['latin', 'vietnamese'],
  weight: ['500', '600', '700'],
  variable: '--font-serif-vn',
  display: 'swap',
});

export const viewport: Viewport = {
  // Màu brand — thanh trạng thái/trình duyệt trên mobile nhuộm theo app.
  themeColor: '#C22A44',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
    canonical: '/',
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
    url: '/',
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
      '@type': 'WebApplication',
      name: SITE_NAME,
      alternateName: 'dichbome',
      url: `${SITE_URL}/`,
      description: SITE_DESCRIPTION,
      inLanguage: 'vi',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Any',
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
    <html lang="vi" className={`${sans.variable} ${display.variable} ${serifVn.variable}`}>
      <body className="font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
        {children}
      </body>
    </html>
  );
}
