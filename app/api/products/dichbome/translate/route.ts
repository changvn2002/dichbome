import { NextResponse } from 'next/server';
import { handleTranslatePost } from '@/lib/server/translate-handler';

/**
 * POST /api/products/dichbome/translate
 * Port của Nest endpoint `POST /api/products/dichbome/translate`
 * (server/src/products/dichbome của repo gốc) — cùng validation, cùng engine.
 * Public, không cần đăng nhập (giống bản gốc).
 *
 * Route này chỉ là adapter mỏng: toàn bộ logic (validation chặt SEC-05 +
 * error shape thống nhất ARC-09 + chạy engine) nằm ở
 * lib/server/translate-handler.ts để test trực tiếp được
 * (tests/api-routes.test.mjs).
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const { status, body } = handleTranslatePost(rawBody);
  return NextResponse.json(body, { status });
}
