/**
 * Helper fetch cho API của chính app này (route handlers
 * `/api/products/dichbome/*` tích hợp sẵn trong repo).
 *
 * Base URL mặc định là '' (cùng origin). Đặt NEXT_PUBLIC_API_URL nếu muốn
 * trỏ sang backend riêng tương thích contract (vd bản NestJS gốc).
 *
 * App KHÔNG có đăng nhập và KHÔNG gửi kèm credential nào: bản trước của
 * file này mang theo shim token của host cũ (đọc token từ localStorage
 * rồi gắn header Authorization) dù không tính năng nào dùng — đã xoá hẳn
 * ở fix wave 3 (SEC-12: đường code credential-trong-localStorage không
 * được ship vào bundle khi app không có auth).
 */
export function apiBase() {
  return (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${apiBase()}${path}`, { ...init, headers });
  const text = await response.text();
  const data = text ? (JSON.parse(text) as T) : (undefined as T);
  if (!response.ok) {
    // Error shape thống nhất (ARC-09): { error: { code, message, fields? } }.
    // Vẫn đọc được field `message` rời của backend ngoài tương thích contract.
    const record = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
    const nested =
      record && typeof record.error === 'object' && record.error !== null
        ? (record.error as Record<string, unknown>).message
        : undefined;
    const flat = record?.message;
    const message =
      typeof nested === 'string'
        ? nested
        : Array.isArray(flat)
          ? flat.join(', ')
          : typeof flat === 'string'
            ? flat
            : response.statusText;
    throw new Error(message);
  }
  return data;
}
