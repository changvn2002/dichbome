// UI helpers (redesign-v2) — W3a: clipboard trung thực + planDelete thuần.
// Chạy: pnpm test
// clipboard.ts và undo.ts là module lá không có import nội bộ nên import .ts trực tiếp được.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { copyText } from '../components/dichbome/lib/clipboard.ts';
import { planDelete } from '../components/dichbome/lib/undo.ts';

test('ui-helpers: copyText — writer resolve -> true', async () => {
  const ok = await copyText('xin chào', {
    writeText: async () => {},
    execCopy: () => false,
  });
  assert.equal(ok, true);
});

test('ui-helpers: copyText — writer reject + execCopy false -> false (không báo giả)', async () => {
  const ok = await copyText('xin chào', {
    writeText: async () => {
      throw new Error('denied');
    },
    execCopy: () => false,
  });
  assert.equal(ok, false);
});

test('ui-helpers: copyText — writer reject + execCopy true -> true', async () => {
  const ok = await copyText('xin chào', {
    writeText: async () => {
      throw new Error('denied');
    },
    execCopy: () => true,
  });
  assert.equal(ok, true);
});

test('ui-helpers: copyText — không writer + execCopy false -> false', async () => {
  const ok = await copyText('xin chào', { execCopy: () => false });
  assert.equal(ok, false);
});

test('ui-helpers: planDelete — xoá 1 id giữa mảng giữ đúng thứ tự', () => {
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
  const { remaining, removed } = planDelete(items, new Set(['b']));
  assert.deepEqual(
    remaining.map((i) => i.id),
    ['a', 'c', 'd'],
  );
  assert.deepEqual(
    removed.map((i) => i.id),
    ['b'],
  );
});

test('ui-helpers: planDelete — xoá hết', () => {
  const items = [{ id: 'a' }, { id: 'b' }];
  const { remaining, removed } = planDelete(items, new Set(['a', 'b']));
  assert.deepEqual(remaining, []);
  assert.deepEqual(
    removed.map((i) => i.id),
    ['a', 'b'],
  );
});

test('ui-helpers: planDelete — id không tồn tại -> removed rỗng', () => {
  const items = [{ id: 'a' }, { id: 'b' }];
  const { remaining, removed } = planDelete(items, new Set(['zzz']));
  assert.deepEqual(
    remaining.map((i) => i.id),
    ['a', 'b'],
  );
  assert.deepEqual(removed, []);
});
