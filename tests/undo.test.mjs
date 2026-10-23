// CQ-05 (fix wave 4): unit test RIÊNG cho components/dichbome/lib/undo.ts —
// trước đây module này chỉ được xác minh gián tiếp qua luồng panel, bản đồ
// QA-BUG-TEST-MAP tự khai "chưa có unit test riêng". File undo.ts là file
// được bảo vệ (đóng băng hành vi): test chỉ IMPORT, không sửa module.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planDelete } from '../components/dichbome/lib/undo.ts';

const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }];

test('undo/planDelete: tách đúng phần còn lại và phần bị xoá', () => {
  const { remaining, removed } = planDelete(items, new Set(['b', 'd']));
  assert.deepEqual(
    remaining.map((x) => x.id),
    ['a', 'c', 'e'],
  );
  assert.deepEqual(
    removed.map((x) => x.id),
    ['b', 'd'],
  );
});

test('undo/planDelete: giữ nguyên thứ tự gốc ở cả hai phía (hoàn tác khôi phục đúng vị trí tương đối)', () => {
  const { remaining, removed } = planDelete(items, new Set(['e', 'a', 'c']));
  assert.deepEqual(
    removed.map((x) => x.id),
    ['a', 'c', 'e'],
  );
  assert.deepEqual(
    remaining.map((x) => x.id),
    ['b', 'd'],
  );
});

test('undo/planDelete: không id nào → không xoá gì; mọi id → xoá hết', () => {
  const none = planDelete(items, new Set());
  assert.equal(none.removed.length, 0);
  assert.deepEqual(none.remaining, items);
  const all = planDelete(items, new Set(items.map((x) => x.id)));
  assert.equal(all.remaining.length, 0);
  assert.deepEqual(all.removed, items);
});

test('undo/planDelete: id lạ không có trong danh sách bị bỏ qua; danh sách rỗng an toàn', () => {
  const { remaining, removed } = planDelete(items, new Set(['zzz']));
  assert.equal(removed.length, 0);
  assert.equal(remaining.length, items.length);
  assert.deepEqual(planDelete([], new Set(['a'])), { remaining: [], removed: [] });
});

test('undo/planDelete: không mutate mảng đầu vào và giữ nguyên tham chiếu phần tử', () => {
  const snapshot = [...items];
  const { remaining, removed } = planDelete(items, new Set(['b']));
  assert.deepEqual(items, snapshot);
  assert.equal(remaining[0], items[0]);
  assert.equal(removed[0], items[1]);
});
