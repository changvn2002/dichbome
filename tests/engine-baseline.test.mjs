// Baseline regression gate — dichbome (Sprint 1, hạng mục C7).
// Chạy: pnpm test
// Chỉ chứa các bất biến ĐANG ĐÚNG hôm nay: khoá hành vi để mọi sửa đổi sau này
// (engine, fallback, API) phải chứng minh không làm hồi quy thầm lặng.
// Các bug đã tái hiện nhưng CHƯA sửa nằm ở tests/known-issues.test.mjs dạng
// quarantine (todo + ID), tuyệt đối không sửa expectation cho khớp output sai.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  translateDichbome,
  canonicalSpeaker,
  DICHBOME_EXAMPLES,
  DICHBOME_REPLY_LABELS,
} from '../lib/server/engine.ts';
import { translateParentMessage } from '../components/dichbome/lib/translate.ts';

test('baseline: cả 2 engine đều trả kết quả có đủ 3 câu trả lời cho câu phổ biến', () => {
  const s = translateDichbome({ message: 'Tuỳ con', speaker: 'me', context: 'khac' });
  const c = translateParentMessage({ message: 'Tuỳ con', speaker: 'Mẹ', context: 'Khác' });
  assert.ok(s.meaning.length > 0 && c.meaning.length > 0);
  assert.equal(s.replies.length, 3);
  assert.equal(c.replies.length, 3);
});

test('baseline: canonicalSpeaker gập alias mom/dad/parents về me/bo/both', () => {
  assert.equal(canonicalSpeaker('mom'), 'me');
  assert.equal(canonicalSpeaker('dad'), 'bo');
  assert.equal(canonicalSpeaker('parents'), 'both');
});

test('baseline: contract HTTP của engine server — nhãn 3 câu trả lời cố định', () => {
  const s = translateDichbome({
    message: 'Tuỳ con, mẹ sao cũng được',
    speaker: 'me',
    context: 'khac',
  });
  assert.deepEqual(
    s.replies.map((r) => r.label),
    [...DICHBOME_REPLY_LABELS],
  );
  assert.ok(s.angerLevel >= 0 && s.angerLevel <= 100);
  assert.ok(typeof s.dangerLabel === 'string' && s.dangerLabel.length > 0);
});

test('baseline: danh sách examples server không rỗng và đủ trường bắt buộc', () => {
  assert.ok(DICHBOME_EXAMPLES.length > 0);
  for (const e of DICHBOME_EXAMPLES) {
    assert.ok(e.message && e.speaker && e.context, `example thiếu trường: ${JSON.stringify(e)}`);
  }
});
