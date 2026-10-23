/**
 * Storage adapter DUY NHẤT của app (ARC-04/ARC-05, fix wave 3).
 *
 * Mọi truy cập localStorage đều đi qua module này — component 'use client'
 * không gọi `localStorage.` trực tiếp nữa (trước wave này có 7 call site ở
 * 3 file: app.tsx, composer.tsx, lib/api.ts). Adapter nuốt mọi lỗi truy cập
 * (bộ nhớ đầy, bị chặn, chế độ riêng tư) theo đúng hành vi cũ: đọc lỗi =
 * coi như chưa có dữ liệu; ghi lỗi = bỏ qua, app vẫn chạy.
 *
 * Phiên bản schema (ARC-10): dữ liệu dạng blob (lịch sử, đã lưu, prefs)
 * được ghi trong phong bì `{ schemaVersion, data }`. Bản production trước
 * wave này ghi JSON trần không phong bì — đó là định dạng legacy (coi như
 * version 0): `readVersioned` vẫn đọc được nguyên vẹn (migrate-on-read —
 * lần ghi kế tiếp tự bọc phong bì), không mất dữ liệu của người dùng khi
 * app cập nhật. Phong bì có schemaVersion LỚN HƠN bản app hiểu được trả
 * về null (không đọc bừa định dạng tương lai).
 */
export const STORAGE_SCHEMA_VERSION = 1;

type Envelope<T> = { schemaVersion: number; data: T };

function isEnvelope(value: unknown): value is Envelope<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'schemaVersion' in value &&
    typeof (value as { schemaVersion: unknown }).schemaVersion === 'number' &&
    'data' in value
  );
}

/** Đọc raw string; phân biệt được "không đọc được" với "chưa có key". */
export function tryReadRaw(key: string): { ok: true; value: string | null } | { ok: false } {
  try {
    return { ok: true, value: window.localStorage.getItem(key) };
  } catch {
    return { ok: false };
  }
}

/** Ghi raw string, best-effort: trả false khi storage không ghi được. */
export function writeRaw(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Đọc blob có phiên bản. Trả null khi: chưa có key, JSON hỏng, storage
 * không đọc được, hoặc schemaVersion mới hơn bản app này hiểu.
 * Định dạng legacy (JSON trần, không phong bì) được trả nguyên data —
 * xem ghi chú migrate-on-read ở đầu file.
 */
export function readVersioned<T>(key: string): T | null {
  const raw = tryReadRaw(key);
  if (!raw.ok || raw.value === null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.value);
  } catch {
    return null;
  }
  if (isEnvelope(parsed)) {
    if (parsed.schemaVersion > STORAGE_SCHEMA_VERSION) return null;
    return parsed.data as T;
  }
  // Legacy (trước fix wave 3): JSON trần — dữ liệu vẫn hợp lệ, dùng luôn.
  return parsed as T;
}

/** Ghi blob kèm phong bì schemaVersion hiện hành. Lỗi ghi bị nuốt (best-effort). */
export function writeVersioned(key: string, data: unknown): void {
  const envelope: Envelope<unknown> = { schemaVersion: STORAGE_SCHEMA_VERSION, data };
  writeRaw(key, JSON.stringify(envelope));
}
