import { NextResponse } from 'next/server';
import { getDichbomeExamples } from '@/lib/server/engine';

/**
 * GET /api/products/dichbome/examples
 * Port của Nest endpoint `GET /api/products/dichbome/examples`
 * (server/src/products/dichbome của repo gốc) — trả danh sách câu mẫu tĩnh.
 */
export async function GET() {
  return NextResponse.json(
    { examples: getDichbomeExamples() },
    {
      headers: {
        // Danh sách câu mẫu là dữ liệu tĩnh trong bộ nhớ: cache CDN ngắn + SWR
        // để giảm round-trip lúc app mount, nhưng không ghim bản cũ quá lâu
        // (cấm immutable — danh sách còn được bổ sung theo sprint nội dung).
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
      },
    },
  );
}
