// FIX v1.4.1 — mục 5 / nợ N5-5 Panel #05 (engine, họ M-2): mệnh đề cam
// chịu / cô đơn ở GIỮA tin bị nuốt.
// Panel #05 tái lập xác định 3 lần trên đầu vào nguyên văn PANEL115:
//   Ý thật chỉ bề mặt hoá D1 («Chủ nhật này con bận thì cứ lo việc của con
//   đi») + D2 («khỏi cần về ăn cơm với mẹ đâu»); mệnh đề mang tải cảm xúc
//   chính «mẹ ở nhà một mình cũng quen rồi» KHÔNG thành chi tiết riêng ở cả
//   2 hoàn cảnh; 6/6 replies chỉ xử lý D1/D2; lần chạm duy nhất «mẹ đừng ăn
//   một mình» bám khung bữa ăn của D2 — KHÔNG được tính là đáp trực tiếp.
// Nguyên nhân (xem FIX-V141-ENGINE-LOG.md): extractSalientDetails chỉ giữ
// chi tiết dài nhất + chi tiết cuối cùng — vế giữa rơi khỏi cả hai suất.
// Quy tắc sửa (họ M-2, tổng quát theo HỌ mệnh đề, CẤM vá cứng chuỗi
// PANEL115): một vế đủ-riêng thuộc họ cam chịu/cô đơn (một mình / cô đơn /
// cô độc / lẻ loi / lủi thủi / quen rồi / quen dần) mà không phải D1/D2 thì
// được tách thành chi tiết riêng thứ ba trong Ý thật + một reply đáp thẳng
// vào sự cô đơn đó (câu đáp sau khi gỡ đoạn trích phải nhắc «một mình»
// ngoài khung bữa ăn).
// Điều kiện đóng của đợt: PANEL115 × {Về quê, Khác} × {server, client} —
// mệnh đề thành chi tiết riêng HOẶC ≥1 reply đáp trực tiếp; ở đây khoá CẢ
// HAI vế của điều kiện (chi tiết riêng VÀ reply đáp trực tiếp), cộng biến
// thể cùng họ (không phải chuỗi PANEL115) và ca đối chứng không thuộc họ.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translateDichbome } from '../lib/server/engine.ts';
import { translateParentMessage } from '../components/dichbome/lib/translate.ts';

const PANEL115 =
  'Thôi, tùy con. Chủ nhật này con bận thì cứ lo việc của con đi, mẹ ở nhà một mình cũng quen rồi, khỏi cần về ăn cơm với mẹ đâu.';
const D1 = 'Chủ nhật này con bận thì cứ lo việc của con đi';
const D2 = 'khỏi cần về ăn cơm với mẹ đâu';
const LONELY = 'mẹ ở nhà một mình cũng quen rồi';

const quotedDetails = (meaning) => [...meaning.matchAll(/“([^”]+)”/g)].map((m) => m[1]);
const stripQuotes = (s) => s.replace(/“[^”]*”/g, '');

// Đáp trực tiếp vào cô đơn = một câu (sau khi gỡ đoạn trích nguyên văn) có
// nhắc «một mình» mà KHÔNG nằm trong khung bữa ăn (không chứa «ăn») —
// đúng tiêu chí panel: «mẹ đừng ăn một mình» qua D2 không được tính.
function hasDirectLonelyReply(r) {
  return r.replies.some((x) =>
    stripQuotes(x.text)
      .split(/[.—;]/)
      .some((sent) => sent.includes('một mình') && !sent.includes('ăn')),
  );
}

function combos(message) {
  return [
    ['server × Về quê', translateDichbome({ message, speaker: 'me', context: 've-que' })],
    ['server × Khác', translateDichbome({ message, speaker: 'me', context: 'khac' })],
    ['client × Về quê', translateParentMessage({ message, speaker: 'Mẹ', context: 'Về quê' })],
    ['client × Khác', translateParentMessage({ message, speaker: 'Mẹ', context: 'Khác' })],
  ];
}

test('N5-5: PANEL115 × 2 hoàn cảnh × 2 engine — vế cam chịu/cô đơn thành chi tiết riêng + có reply đáp trực tiếp', () => {
  for (const [label, r] of combos(PANEL115)) {
    // Bằng chứng in ra cho từng tổ hợp (chi tiết trích được + replies).
    console.log(`\n[${label}] details=${JSON.stringify(quotedDetails(r.meaning))}`);
    r.replies.forEach((x, i) => console.log(`[${label}] reply[${i}]: ${x.text}`));
    // Không hồi quy D1/D2 (điều kiện M-2/w4 cũ giữ nguyên).
    assert.ok(r.meaning.includes(D1), `${label}: mất D1`);
    assert.ok(r.meaning.includes(D2), `${label}: mất D2`);
    // Điều kiện đóng 1: mệnh đề là một chi tiết riêng của chính nó.
    assert.ok(
      quotedDetails(r.meaning).includes(LONELY),
      `${label}: «${LONELY}» chưa thành chi tiết riêng — details=${JSON.stringify(quotedDetails(r.meaning))}`,
    );
    // Điều kiện đóng 2: ≥1 reply đáp trực tiếp bằng lời (không tính khung bữa ăn).
    assert.ok(hasDirectLonelyReply(r), `${label}: chưa reply nào đáp trực tiếp vào vế cô đơn`);
  }
  // Parity Ý thật server ↔ client ở cả 2 hoàn cảnh (khoá mirror hai engine).
  const [srvVe, srvKhac, cliVe, cliKhac] = combos(PANEL115).map(([, r]) => r);
  assert.equal(cliVe.meaning, srvVe.meaning);
  assert.equal(cliKhac.meaning, srvKhac.meaning);
});

test('N5-5: biến thể cùng họ cam chịu/cô đơn (không phải chuỗi PANEL115) cũng được tách riêng — 2 engine', () => {
  const variants = [
    {
      name: 'một mình, không «quen rồi»',
      message:
        'Thôi, tùy con. Tuần sau con đi công tác xa cả tuần liền, mẹ ở nhà một mình suốt cũng được, khỏi cần lo cho mẹ đâu.',
      lonely: 'mẹ ở nhà một mình suốt cũng được',
    },
    {
      name: '«quen rồi» + lủi thủi, không «một mình»',
      message:
        'Thôi, tùy con. Thứ bảy này con phải tăng ca ở công ty cả ngày, mẹ ở nhà lủi thủi quen rồi đấy, khỏi cần ghé qua nhà thăm mẹ đâu.',
      lonely: 'mẹ ở nhà lủi thủi quen rồi đấy',
    },
    {
      name: 'sống một mình + cô đơn',
      message:
        'Thôi, tùy con. Cuối tuần này con đi chơi xa với bạn bè, mẹ sống một mình cô đơn cũng quen, khỏi cần về nhà với mẹ đâu.',
      lonely: 'mẹ sống một mình cô đơn cũng quen',
    },
  ];
  for (const v of variants) {
    const runs = [
      ['server', translateDichbome({ message: v.message, speaker: 'me', context: 'khac' })],
      ['client', translateParentMessage({ message: v.message, speaker: 'Mẹ', context: 'Khác' })],
    ];
    for (const [engine, r] of runs) {
      assert.ok(
        quotedDetails(r.meaning).includes(v.lonely),
        `${engine}/${v.name}: «${v.lonely}» chưa thành chi tiết riêng — details=${JSON.stringify(quotedDetails(r.meaning))}`,
      );
      assert.ok(
        hasDirectLonelyReply(r),
        `${engine}/${v.name}: chưa reply nào đáp trực tiếp vào vế cô đơn`,
      );
    }
  }
});

test('N5-5: ca đối chứng 3 vế KHÔNG thuộc họ cam chịu/cô đơn — không sinh vế cam chịu, không đáp cô đơn', () => {
  const message =
    'Thôi, tùy con. Thứ bảy này mẹ đi khám ở bệnh viện huyện, chiều nay con đón cháu ở trường nhé, nhớ mang áo mưa theo nữa đấy.';
  const runs = [
    translateDichbome({ message, speaker: 'me', context: 'khac' }),
    translateParentMessage({ message, speaker: 'Mẹ', context: 'Khác' }),
  ];
  for (const r of runs) {
    assert.ok(!r.meaning.includes('vế cam chịu'), r.meaning);
    assert.ok(!hasDirectLonelyReply(r), r.replies.map((x) => x.text).join(' | '));
  }
});
