// M-2 (Panel #02, D-3) — độ sâu kết quả cho tin dài ở đường MẪU CHUNG.
// Bằng chứng panel: tin 115 ký tự (vai Mẹ, hoàn cảnh "Về quê") cho meaning /
// realWant / cả 3 replies giống hệt 100% câu cụt "Tùy con".
// Quy tắc đã áp dụng (cả server lẫn client):
//   - chỉ đường generic: entry/rule KHÔNG gắn vai, hoặc fallback;
//   - chỉ tin dài (>= 50 ký tự);
//   - output bổ sung (a) hoàn cảnh đã chọn và (b) một chi tiết riêng trích
//     nguyên văn từ chính tin (đoạn con dài nhất còn >= 4 từ riêng sau khi
//     gỡ mẫu đã khớp) vào Ý thật + Điều muốn nghe + câu trả lời đầu tiên;
//   - tin rất dài (>= 80) mà không tách được chi tiết riêng thì Ý thật khai
//     báo rõ giới hạn "chỉ chắc ở mức mẫu chung" ngay trên phiếu;
//   - entry gắn đúng vai và tin ngắn giữ nguyên từng byte — khoá riêng ở
//     tests/golden-corpus-parents.test.mjs;
//   - phân loại tier không đổi: classifyDichbomeInput vẫn trả entry/generic
//     cho ca panel, nên chip "Khớp câu mẫu chung" (keep-list niềm tin) còn nguyên.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translateDichbome, classifyDichbomeInput } from '../lib/server/engine.ts';
import { translateParentMessage } from '../components/dichbome/lib/translate.ts';

// Nguyên văn ca R5/R3 đo lại ở Panel #02 (115 ký tự).
const PANEL_MESSAGE =
  'Thôi tùy con thôi, mẹ sao cũng được. Chủ nhật này con bận thì cứ lo việc của con đi, khỏi cần về ăn cơm với mẹ đâu.';
const PANEL_DETAIL = 'Chủ nhật này con bận thì cứ lo việc của con đi';
assert.equal(PANEL_MESSAGE.length, 115);

test('M-2 server: ca panel 115 ký tự — output phản ánh hoàn cảnh + chi tiết riêng', () => {
  const long = translateDichbome({ message: PANEL_MESSAGE, speaker: 'me', context: 've-que' });
  const short = translateDichbome({ message: 'Tùy con', speaker: 'me', context: 'khac' });
  assert.notDeepEqual(long, short);
  assert.ok(long.meaning.includes(`“${PANEL_DETAIL}”`), long.meaning);
  assert.ok(long.meaning.includes('“Về quê”'), long.meaning);
  assert.ok(long.realWant.includes(PANEL_DETAIL), long.realWant);
  assert.ok(long.realWant.includes('Về quê'), long.realWant);
  assert.ok(long.replies[0].text.includes(PANEL_DETAIL), long.replies[0].text);
  assert.equal(long.replies.length, 3);
  // Tier khai báo không đổi — điều kiện giữ niềm tin của panel.
  assert.deepEqual(classifyDichbomeInput({ message: PANEL_MESSAGE, speaker: 'me' }), {
    matchKind: 'entry',
    roleSpecific: false,
  });
});

test('M-2 server: đổi hoàn cảnh đã chọn thì output đổi theo', () => {
  const veQue = translateDichbome({ message: PANEL_MESSAGE, speaker: 'me', context: 've-que' });
  const congViec = translateDichbome({
    message: PANEL_MESSAGE,
    speaker: 'me',
    context: 'cong-viec',
  });
  const khac = translateDichbome({ message: PANEL_MESSAGE, speaker: 'me', context: 'khac' });
  assert.ok(congViec.meaning.includes('“Công việc”'), congViec.meaning);
  assert.notEqual(veQue.meaning, congViec.meaning);
  // Không chọn hoàn cảnh cụ thể: vẫn có chi tiết riêng, không bịa hoàn cảnh.
  assert.ok(khac.meaning.includes(PANEL_DETAIL), khac.meaning);
  assert.ok(!khac.meaning.includes('hoàn cảnh “'), khac.meaning);
  assert.notEqual(khac.meaning, veQue.meaning);
});

test('M-2 server: đổi chi tiết riêng trong tin thì output đổi theo chi tiết đó', () => {
  const a = translateDichbome({ message: PANEL_MESSAGE, speaker: 'me', context: 've-que' });
  const other =
    'Thôi tùy con thôi, mẹ sao cũng được. Thứ bảy này con phải trực ở công ty cả ngày, chắc không ghé qua nhà ăn cơm được đâu nhé.';
  const b = translateDichbome({ message: other, speaker: 'me', context: 've-que' });
  assert.notEqual(a.meaning, b.meaning);
  assert.ok(b.meaning.includes('Thứ bảy này con phải trực ở công ty cả ngày'), b.meaning);
  assert.ok(!b.meaning.includes(PANEL_DETAIL), b.meaning);
});

test('M-2 server: tin ngắn ở đường generic giữ nguyên — không chèn chi tiết', () => {
  const short = translateDichbome({ message: 'Tùy con', speaker: 'me', context: 'khac' });
  assert.ok(!short.meaning.includes('Chi tiết riêng trong tin này'));
  assert.ok(!short.replies[0].text.includes('Riêng chuyện'));
});

test('M-2 server: entry gắn đúng vai dù tin dài cũng không bị bổ sung', () => {
  const wifeLong = translateDichbome({
    message:
      'Em không sao, anh tự hiểu đi, em nói thật đấy chứ không phải em giận gì đâu mà anh cứ hỏi mãi thế này hoài vậy',
    speaker: 'wife',
    context: 'khac',
  });
  assert.ok(!wifeLong.meaning.includes('Chi tiết riêng trong tin này'), wifeLong.meaning);
});

test('M-2 server: fallback của bố/mẹ cho tin dài cũng phản ánh chi tiết + hoàn cảnh', () => {
  const r = translateDichbome({
    message:
      'Hôm nay con đi làm về muộn lắm, trời mưa to suốt cả buổi chiều, con kẹt xe gần một tiếng ở cầu nên chưa kịp ăn gì đâu ạ',
    speaker: 'bo',
    context: 'cong-viec',
  });
  assert.ok(
    r.meaning.includes('con kẹt xe gần một tiếng ở cầu nên chưa kịp ăn gì đâu ạ'),
    r.meaning,
  );
  assert.ok(r.meaning.includes('“Công việc”'), r.meaning);
  assert.ok(r.replies[0].text.includes('Riêng chuyện'), r.replies[0].text);
});

test('M-2 server: tin dài toàn mẫu lặp lại — khai báo rõ giới hạn trong Ý thật', () => {
  const repeated =
    'Tùy con, tùy con, tùy con, tùy con, tùy con, tùy con, tùy con, tùy con, tùy con, tùy con nhé';
  assert.ok(repeated.length >= 80);
  const r = translateDichbome({ message: repeated, speaker: 'me', context: 've-que' });
  assert.ok(r.meaning.includes('chưa tách được chi tiết riêng nào ngoài mẫu chung'), r.meaning);
  assert.ok(r.meaning.includes('“Về quê”'), r.meaning);
});

test('M-2 client: ca panel phía offline — output phản ánh hoàn cảnh + chi tiết riêng', () => {
  const long = translateParentMessage({ message: PANEL_MESSAGE, speaker: 'Mẹ', context: 'Về quê' });
  const short = translateParentMessage({ message: 'Tùy con', speaker: 'Mẹ', context: 'Khác' });
  assert.notDeepEqual(long, short);
  assert.ok(long.meaning.includes(`“${PANEL_DETAIL}”`), long.meaning);
  assert.ok(long.meaning.includes('“Về quê”'), long.meaning);
  assert.ok(long.realWant.includes(PANEL_DETAIL), long.realWant);
  assert.ok(long.replies[0].text.includes(PANEL_DETAIL), long.replies[0].text);
  assert.ok(!short.meaning.includes('Chi tiết riêng trong tin này'));
});

test('M-2 client: rule gắn đúng vai dù tin dài cũng không bị bổ sung; fallback dài thì có', () => {
  const wifeLong = translateParentMessage({
    message:
      'Em không sao, anh tự hiểu đi, em nói thật đấy chứ không phải em giận gì đâu mà anh cứ hỏi mãi thế này hoài vậy',
    speaker: 'Vợ',
    context: 'Khác',
  });
  assert.ok(!wifeLong.meaning.includes('Chi tiết riêng trong tin này'), wifeLong.meaning);
  const fallbackLong = translateParentMessage({
    message:
      'Hôm nay nhà mình có chuyện này muốn kể thật dài, từ sáng tới giờ bao nhiêu việc dồn lại cùng một lúc khiến ai cũng mệt hết cả người luôn rồi đấy ạ',
    speaker: 'Bố',
    context: 'Công việc',
  });
  assert.ok(fallbackLong.meaning.includes('Chi tiết riêng trong tin này'), fallbackLong.meaning);
  assert.ok(fallbackLong.meaning.includes('“Công việc”'), fallbackLong.meaning);
});
