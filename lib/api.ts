/**
 * Shim tương đương helper `@/lib/api` của host ChangtoTech (chỉ giữ phần app dùng).
 *
 * Khác biệt duy nhất so với bản gốc: base URL mặc định là '' (cùng origin) vì bản
 * standalone tích hợp sẵn route handlers `/api/products/dichbome/*` trong chính
 * app Next này. Đặt NEXT_PUBLIC_API_URL nếu muốn trỏ sang backend riêng tương
 * thích contract (vd bản NestJS gốc). Token (nếu có) vẫn đọc từ localStorage
 * khóa `changto_token` và gắn Authorization như bản gốc — app này không cần
 * đăng nhập nên thường sẽ không có token.
 */
const TOKEN_KEY = 'changto_token';

export function apiBase() {
  return (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');
}

export function loadToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = loadToken();
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${apiBase()}${path}`, { ...init, headers });
  const text = await response.text();
  const data = text ? (JSON.parse(text) as T) : (undefined as T);
  if (!response.ok) {
    const message =
      data && typeof data === 'object' && 'message' in data
        ? Array.isArray((data as { message: unknown }).message)
          ? (data as { message: string[] }).message.join(', ')
          : String((data as { message: unknown }).message)
        : response.statusText;
    throw new Error(message);
  }
  return data;
}
