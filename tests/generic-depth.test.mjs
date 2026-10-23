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

// ---------------------------------------------------------------------------
// M-2 PHẦN CÒN LẠI (Panel #03 §10.2, fix wave 4) — điều kiện đóng của R3:
//   (1) bao phủ chi tiết 2/2 ở ca 115 ký tự của Panel #03 (bản có vế
//       «mẹ ở nhà một mình cũng quen rồi»): cả hai mệnh đề chi tiết đều được
//       nhắc trong ≥1 trường của {Ý thật, Điều muốn nghe, replies};
//   (2) ≥2/3 câu trả lời khác stub ở ca 115;
//   (3) dòng mức identical stub/long phải kèm lý do ngay trên phiếu (công
//       thức angerLevel không đổi — lý do nằm trong Ý thật);
//   (4) chi tiết có mặt trong Ý thật (không hồi quy);
//   (5) dải 30–60 ký tự: bộ 5 ca chuẩn, mỗi ca đúng 1 mệnh đề chi tiết →
//       chi tiết được phản ánh trong Ý thật ở 100% ca;
//   (6) cổng theo loại đường: fallback thuần dạng một ý (31–48 ký tự) giữ
//       nguyên từng byte — corpus vàng khoá các ca này, "chi tiết" ở đó
//       chỉ là cả tin tự trích chính nó.
// Quy tắc trích (cả 2 engine): gỡ mẫu theo entry/rule ĐÃ KHỚP (không phải
// toàn ngân hàng); chi tiết 1 = đoạn đủ riêng dài nhất; chi tiết 2 = đoạn
// đủ riêng cuối cùng trong tin.

const PANEL03_MESSAGE =
  'Thôi, tùy con. Chủ nhật này con bận thì cứ lo việc của con đi, mẹ ở nhà một mình cũng quen rồi, khỏi cần về ăn cơm với mẹ đâu.';
const PANEL03_DETAIL_1 = 'Chủ nhật này con bận thì cứ lo việc của con đi';
const PANEL03_DETAIL_2 = 'khỏi cần về ăn cơm với mẹ đâu';
const STUB_MESSAGE = 'Tùy con, mẹ sao cũng được.';

test('M-2/w4 server: ca Panel #03 115 ký tự — bao phủ 2/2, ≥2/3 replies khác stub, có lý do mức', () => {
  const stub = translateDichbome({ message: STUB_MESSAGE, speaker: 'me', context: 'khac' });
  const r = translateDichbome({ message: PANEL03_MESSAGE, speaker: 'me', context: 've-que' });
  const allUnits = [r.meaning, r.realWant, ...r.replies.map((x) => x.text)].join('\n');
  // (1) bao phủ 2/2
  assert.ok(allUnits.includes(PANEL03_DETAIL_1), 'thiếu chi tiết 1');
  assert.ok(allUnits.includes(PANEL03_DETAIL_2), 'thiếu chi tiết 2 (vế cơm)');
  // (4) cả hai chi tiết đều vào Ý thật; chi tiết 2 vào cả replies[1]
  assert.ok(r.meaning.includes(PANEL03_DETAIL_1), r.meaning);
  assert.ok(r.meaning.includes(PANEL03_DETAIL_2), r.meaning);
  assert.ok(r.replies[1].text.includes(PANEL03_DETAIL_2), r.replies[1].text);
  // (2) ít nhất 2/3 câu trả lời khác stub
  const differing = r.replies.filter((x, i) => x.text !== stub.replies[i].text).length;
  assert.ok(differing >= 2, `chỉ ${differing}/3 replies khác stub`);
  // (3) dòng mức HIỂN THỊ không đổi (điểm thô 62 vs 66 cùng quy về 3/5 —
  // công thức adjustAnger giữ nguyên) NHƯNG phiếu có câu lý do đi kèm.
  const uiLevel = (raw) => Math.min(5, Math.max(0, raw > 5 ? Math.round((raw / 100) * 5) : raw));
  assert.equal(uiLevel(r.angerLevel), uiLevel(stub.angerLevel));
  assert.equal(r.dangerLabel, stub.dangerLabel);
  assert.ok(r.meaning.includes('Mức căng thẳng chấm theo vế chính của câu'), r.meaning);
});

test('M-2/w4 client: ca Panel #03 115 ký tự — cùng các điều kiện phía offline', () => {
  const stub = translateParentMessage({ message: STUB_MESSAGE, speaker: 'Mẹ', context: 'Khác' });
  const r = translateParentMessage({ message: PANEL03_MESSAGE, speaker: 'Mẹ', context: 'Về quê' });
  const allUnits = [r.meaning, r.realWant, ...r.replies.map((x) => x.text)].join('\n');
  assert.ok(allUnits.includes(PANEL03_DETAIL_1), 'thiếu chi tiết 1');
  assert.ok(allUnits.includes(PANEL03_DETAIL_2), 'thiếu chi tiết 2 (vế cơm)');
  assert.ok(r.meaning.includes(PANEL03_DETAIL_2), r.meaning);
  assert.ok(r.replies[1].text.includes(PANEL03_DETAIL_2), r.replies[1].text);
  const differing = r.replies.filter((x, i) => x.text !== stub.replies[i].text).length;
  assert.ok(differing >= 2, `chỉ ${differing}/3 replies khác stub`);
  assert.ok(r.meaning.includes('Mức căng thẳng chấm theo vế chính của câu'), r.meaning);
  // Parity prong CQ-14: Ý thật hai engine trùng nhau ở ca này.
  const srv = translateDichbome({ message: PANEL03_MESSAGE, speaker: 'me', context: 've-que' });
  assert.equal(r.meaning, srv.meaning);
});

test('M-2/w4: ca 43 ký tự (dưới ngưỡng 50 cũ) — chi tiết không còn bị nuốt', () => {
  const msg = 'Tùy con, mẹ sao cũng được. Tối nay con bận.';
  assert.equal(msg.length, 43);
  const srv = translateDichbome({ message: msg, speaker: 'me', context: 'khac' });
  assert.ok(srv.meaning.includes('Tối nay con bận'), srv.meaning);
  const cli = translateParentMessage({ message: msg, speaker: 'Mẹ', context: 'Khác' });
  assert.ok(cli.meaning.includes('Tối nay con bận'), cli.meaning);
  assert.equal(cli.meaning, srv.meaning);
});

test('M-2/w4: dải 30–60 ký tự — bộ 5 ca chuẩn, mỗi ca 1 mệnh đề chi tiết, phản ánh 100%', () => {
  const band = [
    { message: 'Sao cũng được. Thứ bảy này mẹ đi khám.', detail: 'Thứ bảy này mẹ đi khám' },
    { message: 'Ừ, tùy con thôi. Tuần sau bố mổ mắt đấy.', detail: 'Tuần sau bố mổ mắt đấy' },
    {
      message: 'Mẹ sao cũng được. Chiều nay con đón cháu nhé.',
      detail: 'Chiều nay con đón cháu nhé',
    },
    { message: 'Tuỳ con quyết định. Nhớ mang áo mưa, trời sắp mưa to.', detail: 'Nhớ mang áo mưa' },
    {
      message: 'Ừ thì tùy con. Tháng này tiền điện tăng gấp đôi rồi đấy.',
      detail: 'Tháng này tiền điện tăng gấp đôi rồi đấy',
    },
  ];
  for (const c of band) {
    assert.ok(c.message.length >= 30 && c.message.length <= 60, `độ dài ${c.message.length}`);
    const srv = translateDichbome({ message: c.message, speaker: 'me', context: 'khac' });
    assert.ok(srv.meaning.includes(c.detail), `${c.message} → ${srv.meaning}`);
    const cli = translateParentMessage({ message: c.message, speaker: 'Mẹ', context: 'Khác' });
    assert.ok(cli.meaning.includes(c.detail), `${c.message} → ${cli.meaning}`);
  }
});

// ---------------------------------------------------------------------------
// Sprint 2 (N-04-3, S1) — ĐUÔI CHỐT thay đuôi hẹn lảng ở khối độ sâu:
//   - khung chốt chọn theo TỪNG chi tiết (Lens 1 §2: họ A/B/C/D/E), giữ
//     nguyên tiền tố ` Riêng chuyện “{detail}”, ` và bất biến detail ∈
//     replies[0], detail2 ∈ replies[1];
//   - replies[2] cũng được nối đuôi An toàn theo detail (kể cả khi không
//     có detail2) — trần chốt của ca 115 thành 3/3 thay vì 2/3;
//   - KHÔNG reply nào còn khớp mẫu HẸN LẢNG của baseline probe
//     (dichbome-qa/sprint-2/baseline-probe.mjs);
//   - ca 115 (cả bản 126 ký tự PANEL03_MESSAGE lẫn bản 115 PANEL_MESSAGE,
//     vai Mẹ + hoàn cảnh Về quê): cả 3 slot khớp regex CHOT của baseline
//     probe (về / không về được + gọi bù / chốt mốc trước 9 giờ);
//   - chi tiết chứa phủ định quanh từ khoá («đừng có về ăn cơm…») → đuôi
//     rơi họ E, không chứa cam kết «về ăn cơm với» ngoài đoạn trích;
//   - khoá biên ngưỡng: generic 29/30/31 ký tự + fallback 79/80/81 — dưới
//     ngưỡng không có «Riêng chuyện», tại/trên ngưỡng có độ sâu.
const HEN_LANG_PATTERNS = [
  /sẽ nói rõ thêm/i,
  /nói rõ .* cho chắc/i,
  /để .* tính sau/i,
  /sẽ thưa lại/i,
  /sẽ liệu sau/i,
  /khi nào .* sẽ nói/i,
];
const CHOT_PATTERNS = [
  /Chủ nhật (này )?(con )?(sẽ )?về/i,
  /con về (ăn cơm|quê)/i,
  /sẽ về/i,
  /không về được/i,
  /con gọi (về )?(lúc|tối|chiều|sáng)/i,
  /con qua nhà/i,
  /con ghé/i,
  // Phụ lục R (R4): slot An toàn họ A chốt mốc bằng «nhắn chốt hẳn …
  // trước 9 giờ» (xem lại lịch rồi nhắn chốt) — không còn cụm «gọi về …
  // trước 9 giờ» trong đuôi nối thêm.
  /nhắn chốt hẳn.*trước 9 giờ/i,
];
const SHORT43_MESSAGE = 'Tùy con, mẹ sao cũng được. Tối nay con bận.';
const CLOSING_CASES = [
  {
    message: PANEL03_MESSAGE,
    ctxS: 've-que',
    ctxC: 'Về quê',
    detail: PANEL03_DETAIL_1,
    detail2: PANEL03_DETAIL_2,
  },
  {
    message: PANEL_MESSAGE,
    ctxS: 've-que',
    ctxC: 'Về quê',
    detail: PANEL03_DETAIL_1,
    detail2: PANEL03_DETAIL_2,
  },
  { message: SHORT43_MESSAGE, ctxS: 'khac', ctxC: 'Khác', detail: 'Tối nay con bận', detail2: null },
  {
    message: 'Sao cũng được. Thứ bảy này mẹ đi khám.',
    ctxS: 'khac',
    ctxC: 'Khác',
    detail: 'Thứ bảy này mẹ đi khám',
    detail2: null,
  },
  {
    message: 'Ừ, tùy con thôi. Tuần sau bố mổ mắt đấy.',
    ctxS: 'khac',
    ctxC: 'Khác',
    detail: 'Tuần sau bố mổ mắt đấy',
    detail2: null,
  },
  {
    message: 'Mẹ sao cũng được. Chiều nay con đón cháu nhé.',
    ctxS: 'khac',
    ctxC: 'Khác',
    detail: 'Chiều nay con đón cháu nhé',
    detail2: null,
  },
  {
    message: 'Tuỳ con quyết định. Nhớ mang áo mưa, trời sắp mưa to.',
    ctxS: 'khac',
    ctxC: 'Khác',
    detail: 'Nhớ mang áo mưa',
    detail2: 'trời sắp mưa to',
  },
  {
    message: 'Ừ thì tùy con. Tháng này tiền điện tăng gấp đôi rồi đấy.',
    ctxS: 'khac',
    ctxC: 'Khác',
    detail: 'Tháng này tiền điện tăng gấp đôi rồi đấy',
    detail2: null,
  },
];

function assertClosingShape(r, c, engineLabel) {
  const texts = r.replies.map((x) => x.text);
  assert.ok(texts[0].includes(c.detail), `${engineLabel} replies[0] thiếu chi tiết: ${texts[0]}`);
  if (c.detail2) {
    assert.ok(texts[1].includes(c.detail2), `${engineLabel} replies[1] thiếu chi tiết 2: ${texts[1]}`);
  }
  for (const t of texts) {
    for (const p of HEN_LANG_PATTERNS) {
      assert.ok(!p.test(t), `${engineLabel} reply còn hẹn lảng (${p}): ${t}`);
    }
  }
  // replies[2] kết thúc bằng đuôi chốt theo detail (chứa «Riêng chuyện»).
  assert.ok(texts[2].includes('Riêng chuyện'), `${engineLabel} replies[2] thiếu đuôi chốt: ${texts[2]}`);
  assert.ok(texts[2].includes(c.detail), `${engineLabel} replies[2] thiếu chi tiết: ${texts[2]}`);
}

test('Sprint2/S1: đuôi chốt ở PANEL115 + SHORT43 + dải 30–60 — 2 engine, hết hẹn lảng', () => {
  assert.equal(PANEL03_MESSAGE.length, 126);
  for (const c of CLOSING_CASES) {
    const srv = translateDichbome({ message: c.message, speaker: 'me', context: c.ctxS });
    assertClosingShape(srv, c, 'server');
    const cli = translateParentMessage({ message: c.message, speaker: 'Mẹ', context: c.ctxC });
    assertClosingShape(cli, c, 'client');
  }
});

test('Sprint2/S1: ca 115 vai Mẹ + Về quê — cả 3 slot đều CHOT (3/3, 2 engine, 2 bản tin)', () => {
  for (const message of [PANEL03_MESSAGE, PANEL_MESSAGE]) {
    const runs = [
      translateDichbome({ message, speaker: 'me', context: 've-que' }),
      translateParentMessage({ message, speaker: 'Mẹ', context: 'Về quê' }),
    ];
    for (const r of runs) {
      r.replies.forEach((x, i) => {
        assert.ok(
          CHOT_PATTERNS.some((p) => p.test(x.text)),
          `slot ${i} chưa chốt theo regex CHOT: ${x.text}`,
        );
      });
      // Khớp tinh thần bản lắp ráp Lens 1 §2.4: slot An toàn chốt mốc 9 giờ.
      assert.ok(r.replies[2].text.includes('trước 9 giờ'), r.replies[2].text);
      // Phụ lục R (R4): đuôi An toàn họ A chứa «nhắn chốt hẳn» + «trước
      // 9 giờ», và PHẦN ĐUÔI nối thêm (từ «Riêng chuyện») không chứa thêm
      // «gọi về» — thân entry có sẵn «gọi về» thì không tính.
      const tail2 = r.replies[2].text.slice(r.replies[2].text.indexOf('Riêng chuyện'));
      assert.ok(tail2.includes('nhắn chốt hẳn'), tail2);
      assert.ok(tail2.includes('trước 9 giờ'), tail2);
      assert.ok(!tail2.includes('gọi về'), tail2);
      // R4: slot Ngoan họ A hết vấp «việc của con con» — có dấu phẩy.
      assert.ok(r.replies[0].text.includes('việc của con, con tự xếp lại được'), r.replies[0].text);
    }
  }
});

test('Sprint2/R3: khung họ B gán đúng chủ thể sự kiện — mổ lấy từ chi tiết, khám chỉ khi {p} là người đi khám', () => {
  const runsFor = (message) => [
    translateDichbome({ message, speaker: 'me', context: 'khac' }),
    translateParentMessage({ message, speaker: 'Mẹ', context: 'Khác' }),
  ];
  // band2: bố mổ (mẹ gửi) — replies[0] không «mẹ mổ», có cam kết có mặt ở bệnh viện.
  for (const r of runsFor('Ừ, tùy con thôi. Tuần sau bố mổ mắt đấy.')) {
    assert.ok(!r.replies[0].text.includes('mẹ mổ'), r.replies[0].text);
    assert.ok(r.replies[0].text.includes('có mặt ở bệnh viện'), r.replies[0].text);
    assert.ok(r.replies[0].text.includes('hôm bố mổ'), r.replies[0].text);
  }
  // band1: chính mẹ đi khám — giữ «đưa mẹ đi khám».
  for (const r of runsFor('Sao cũng được. Thứ bảy này mẹ đi khám.')) {
    assert.ok(r.replies[0].text.includes('đưa mẹ đi khám'), r.replies[0].text);
  }
  // Người thứ ba đi khám: bố đi khám do mẹ gửi — không gán mẹ làm bệnh nhân.
  const thirdParty =
    'Ừ, tùy con thôi. Thứ bảy này bố đi khám mắt ở bệnh viện, con nhớ hỏi lại giờ giấc cho chắc nhé.';
  for (const r of runsFor(thirdParty)) {
    assert.ok(!r.replies[0].text.includes('đưa mẹ đi khám'), r.replies[0].text);
  }
});

test('Sprint2/S1: chi tiết phủ định quanh từ khoá → đuôi rơi họ E', () => {
  const neg =
    'Thôi tùy con thôi, mẹ sao cũng được. Mẹ dặn thật lòng đây nhé con: đừng có về ăn cơm với mẹ đâu, ở lại làm cho xong việc đi con.';
  const stripQuotes = (s) => s.replace(/“[^”]*”/g, '');
  const runs = [
    translateDichbome({ message: neg, speaker: 'me', context: 'khac' }),
    translateParentMessage({ message: neg, speaker: 'Mẹ', context: 'Khác' }),
  ];
  for (const r of runs) {
    assert.ok(r.replies[0].text.includes('đừng có về ăn cơm với mẹ đâu'), r.replies[0].text);
    // Họ E slot Ngoan — nhận việc chung, không cam kết «về ăn cơm với».
    assert.ok(r.replies[0].text.includes('nhận luôn chuyện này'), r.replies[0].text);
    assert.ok(!stripQuotes(r.replies[0].text).includes('về ăn cơm với'), r.replies[0].text);
    assert.ok(!stripQuotes(r.replies[2].text).includes('về ăn cơm với'), r.replies[2].text);
  }
});

test('Sprint2/S1: khoá biên ngưỡng generic 29/30/31 + fallback 79/80/81 (2 engine)', () => {
  const genericBand = [
    { message: 'Tùy con. Tối nay con bận lắm.', len: 29, depth: false, detail: 'Tối nay con bận lắm' },
    { message: 'Tùy con. Tối nay con bận thật.', len: 30, depth: true, detail: 'Tối nay con bận thật' },
    { message: 'Tùy con. Tối nay con bận quá ạ.', len: 31, depth: true, detail: 'Tối nay con bận quá ạ' },
  ];
  for (const c of genericBand) {
    assert.equal(c.message.length, c.len);
    const runs = [
      translateDichbome({ message: c.message, speaker: 'me', context: 'khac' }),
      translateParentMessage({ message: c.message, speaker: 'Mẹ', context: 'Khác' }),
    ];
    for (const r of runs) {
      if (!c.depth) {
        assert.ok(!r.meaning.includes('Chi tiết riêng trong tin này'), r.meaning);
        assert.ok(!r.replies.some((x) => x.text.includes('Riêng chuyện')), r.replies[0].text);
      } else {
        assert.ok(r.meaning.includes(c.detail), r.meaning);
        assert.ok(r.replies[0].text.includes('Riêng chuyện'), r.replies[0].text);
        assert.ok(r.replies[2].text.includes('Riêng chuyện'), r.replies[2].text);
      }
    }
  }
  const fbBase =
    'Hôm nay trời mưa buổi chiều, đường ngập nước khắp nơi, xe cộ kẹt cứng một tiếng';
  const fallbackBand = [
    { message: fbBase, len: 79, depth: false },
    { message: `${fbBase}!`, len: 80, depth: true },
    { message: `${fbBase} ạ`, len: 81, depth: true },
  ];
  for (const c of fallbackBand) {
    assert.equal(c.message.length, c.len);
    const runs = [
      translateDichbome({ message: c.message, speaker: 'bo', context: 'khac' }),
      translateParentMessage({ message: c.message, speaker: 'Bố', context: 'Khác' }),
    ];
    for (const r of runs) {
      if (!c.depth) {
        assert.ok(!r.meaning.includes('Chi tiết riêng trong tin này'), r.meaning);
        assert.ok(!r.replies.some((x) => x.text.includes('Riêng chuyện')), r.replies[0].text);
      } else {
        assert.ok(r.meaning.includes('Hôm nay trời mưa buổi chiều'), r.meaning);
        assert.ok(r.replies[0].text.includes('Riêng chuyện'), r.replies[0].text);
        assert.ok(r.replies[2].text.includes('Riêng chuyện'), r.replies[2].text);
      }
    }
  }
});

test('M-2/w4: fallback thuần một ý 31–48 ký tự giữ nguyên — không tự trích cả tin làm chi tiết', () => {
  const singles = [
    'Nhà mình nói chuyện này nhé con',
    'Tháng này tiền nhà tăng nhiều rồi con ạ',
    'Hôm nay nhà mình có chuyện này muốn nói con nghe',
    'Con ăn uống thế nào, có đói không',
  ];
  for (const message of singles) {
    const srv = translateDichbome({ message, speaker: 'me', context: 'khac' });
    assert.ok(!srv.meaning.includes('Chi tiết riêng trong tin này'), `${message} → ${srv.meaning}`);
    const cli = translateParentMessage({ message, speaker: 'Mẹ', context: 'Khác' });
    assert.ok(!cli.meaning.includes('Chi tiết riêng trong tin này'), `${message} → ${cli.meaning}`);
  }
});
