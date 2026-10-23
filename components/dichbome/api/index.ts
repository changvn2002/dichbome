import { createHttpDichbomeApi } from './http';
import { createLocalDichbomeApi } from './local';
import type { DichbomeApi } from './types';

export type DichbomeApiMode = 'http' | 'local';

export function resolveDichbomeApiMode(): DichbomeApiMode {
  const mode = (process.env.NEXT_PUBLIC_DICHBOME_API_MODE ?? 'http').toLowerCase();
  // 'local' = engine rule-based chạy ngay trên máy (offline); mặc định
  // 'http' = API route của chính app này. Tên mode đổi sang 'local' ở
  // fix wave 3 (DOC-04): đây là chế độ sản phẩm thật trên máy người
  // dùng, không phải bản giả lập.
  return mode === 'local' ? 'local' : 'http';
}

export function createDichbomeApi(mode: DichbomeApiMode = resolveDichbomeApiMode()): DichbomeApi {
  return mode === 'local' ? createLocalDichbomeApi() : createHttpDichbomeApi();
}

export type { DichbomeApi } from './types';
