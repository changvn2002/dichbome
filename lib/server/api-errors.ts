/**
 * Shape lỗi API thống nhất của dichbome (ARC-09) — MỘT nơi khai báo duy nhất:
 *
 *   { error: { code: string, message: string, fields?: string[] } }
 *
 * Mọi route handler dưới app/api/products/dichbome/* phải trả lỗi qua
 * `apiError()` ở đây, không tự chế shape riêng. Client (lib/api.ts) đọc
 * `error.message` để hiển thị. Shape cũ kiểu NestJS
 * `{ statusCode, message[], error }` đã bị loại bỏ ở fix wave 3 (hồ sơ
 * chấm vòng 3, mục ARC-09 + SEC-05).
 */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    fields?: string[];
  };
}

export interface ApiErrorResult {
  status: number;
  body: ApiErrorBody;
}

export function apiError(
  status: number,
  code: string,
  message: string,
  fields?: string[],
): ApiErrorResult {
  return {
    status,
    body: { error: fields ? { code, message, fields } : { code, message } },
  };
}
