import { NextResponse } from 'next/server';
import { getDichbomeExamples } from '@/lib/server/engine';

/**
 * GET /api/products/dichbome/examples
 * Port của Nest endpoint `GET /api/products/dichbome/examples`
 * (server/src/products/dichbome của repo gốc) — trả danh sách câu mẫu tĩnh.
 */
export async function GET() {
  return NextResponse.json({ examples: getDichbomeExamples() });
}
