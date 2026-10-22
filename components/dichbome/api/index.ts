import { createHttpDichbomeApi } from './http';
import { createMockDichbomeApi } from './mock';
import type { DichbomeApi } from './types';

export type DichbomeApiMode = 'http' | 'mock';

export function resolveDichbomeApiMode(): DichbomeApiMode {
  const mode = (process.env.NEXT_PUBLIC_DICHBOME_API_MODE ?? 'http').toLowerCase();
  return mode === 'mock' ? 'mock' : 'http';
}

export function createDichbomeApi(mode: DichbomeApiMode = resolveDichbomeApiMode()): DichbomeApi {
  return mode === 'mock' ? createMockDichbomeApi() : createHttpDichbomeApi();
}

export type { DichbomeApi } from './types';
