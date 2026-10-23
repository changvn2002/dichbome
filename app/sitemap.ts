import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  // App hiện có đúng một route trang: "/" (toàn bộ trải nghiệm nằm trong một màn hình).
  // Khi có thêm route trang thật, bổ sung vào danh sách này.
  return [
    {
      // SEO-04 (fix wave 3): dạng không slash cuối — Next chuẩn hoá
      // canonical/og:url của metadata về đúng dạng này, nên sitemap +
      // JSON-LD dùng cùng một dạng để mọi tín hiệu URL gốc khớp byte.
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ];
}
