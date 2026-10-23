// Storage adapter (ARC-04/05) + schemaVersion/migrate (ARC-10) — fix wave 3.
// Adapter chạy trên window.localStorage: test dựng stub tối thiểu trên
// globalThis.window (Node không có window — adapter coi như không đọc được).
import { test } from 'node:test';
import assert from 'node:assert/strict';

// storage.ts không import nội bộ; import tĩnh trực tiếp được.
import {
  STORAGE_SCHEMA_VERSION,
  readVersioned,
  writeVersioned,
  tryReadRaw,
  writeRaw,
} from '../components/dichbome/lib/storage.ts';

function stubStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    _map: map,
  };
}

// Fixture định dạng LEGACY (bản production trước fix wave 3): JSON trần của
// một mục lịch sử dichbome_history_v1, không phong bì schemaVersion.
const LEGACY_HISTORY = JSON.stringify([
  {
    id: 'legacy-1',
    message: 'Tùy con',
    speaker: 'Mẹ',
    context: 'Khác',
    result: {
      meaning: '…',
      realWant: '…',
      angerLevel: 3,
      dangerLabel: 'Đang nguội giận, đừng châm thêm',
      replies: [],
    },
    at: '2026-10-20T00:00:00.000Z',
  },
]);

test('storage: fixture legacy (JSON trần) vẫn đọc được nguyên vẹn — migrate-on-read', () => {
  globalThis.window = { localStorage: stubStorage({ dichbome_history_v1: LEGACY_HISTORY }) };
  const data = readVersioned('dichbome_history_v1');
  assert.ok(Array.isArray(data));
  assert.equal(data[0].id, 'legacy-1');
  assert.equal(data[0].message, 'Tùy con');
});

test('storage: ghi rồi đọc lại qua phong bì schemaVersion hiện hành', () => {
  const ls = stubStorage();
  globalThis.window = { localStorage: ls };
  writeVersioned('dichbome_saved_v1', [{ id: 'a' }]);
  const raw = JSON.parse(ls._map.get('dichbome_saved_v1'));
  assert.equal(raw.schemaVersion, STORAGE_SCHEMA_VERSION);
  assert.deepEqual(raw.data, [{ id: 'a' }]);
  assert.deepEqual(readVersioned('dichbome_saved_v1'), [{ id: 'a' }]);
});

test('storage: legacy được nâng cấp thành phong bì ở lần ghi kế tiếp', () => {
  const ls = stubStorage({ dichbome_prefs_v1: JSON.stringify({ speaker: 'Mẹ' }) });
  globalThis.window = { localStorage: ls };
  assert.deepEqual(readVersioned('dichbome_prefs_v1'), { speaker: 'Mẹ' });
  writeVersioned('dichbome_prefs_v1', { speaker: 'Bố' });
  const raw = JSON.parse(ls._map.get('dichbome_prefs_v1'));
  assert.equal(raw.schemaVersion, STORAGE_SCHEMA_VERSION);
  assert.deepEqual(raw.data, { speaker: 'Bố' });
});

test('storage: schemaVersion mới hơn bản app hiểu -> null (không đọc bừa)', () => {
  globalThis.window = {
    localStorage: stubStorage({
      k: JSON.stringify({ schemaVersion: STORAGE_SCHEMA_VERSION + 1, data: [1] }),
    }),
  };
  assert.equal(readVersioned('k'), null);
});

test('storage: JSON hỏng / chưa có key / storage bị chặn đều -> null, không throw', () => {
  globalThis.window = { localStorage: stubStorage({ bad: '{không phải json' }) };
  assert.equal(readVersioned('bad'), null);
  assert.equal(readVersioned('missing'), null);
  globalThis.window = {
    localStorage: {
      getItem() {
        throw new Error('blocked');
      },
      setItem() {
        throw new Error('blocked');
      },
    },
  };
  assert.equal(readVersioned('bad'), null);
  assert.equal(tryReadRaw('bad').ok, false);
  assert.equal(writeRaw('k', '1'), false);
  writeVersioned('k', []); // không throw dù ghi thất bại
});
