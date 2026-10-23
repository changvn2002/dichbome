// Sprint 2 (N-04-3, S2) — ma trận rò văn phong theo vai + khoá biến thể.
// Entry generic (tuy-con, khong-sao/khong-sao-dau) gắn roleVariants cho 4 vai
// ngoài gia đình (lover/coworker/boss/friend): tầng lắp ráp chỉ thay thân khi
// entry là generic + vai thuộc nhóm đó. Ma trận dưới quét meaning + realWant +
// replies của {4 vai} × {STUB, «Không sao đâu», PANEL115} × {server, client}
// bằng bộ marker MỞ RỘNG (baseline probe dichbome-qa/sprint-2): 3 marker
// KI-C1 + 'cả nhà mình' + 'gọi về' + tự xưng «con» (regex \bcon\b).
// Trước khi quét phải GỠ đoạn trích “{detail}” khỏi replies và đoạn
// «Chi tiết riêng trong tin này: “…”» khỏi meaning/realWant — chi tiết chứa
// lời của người gửi (vốn có chữ «con») nên được phép còn trong đoạn trích.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translateDichbome } from '../lib/server/engine.ts';
import { translateParentMessage } from '../components/dichbome/lib/translate.ts';

const STUB = 'Tùy con, mẹ sao cũng được.';
const PANEL115 =
  'Thôi, tùy con. Chủ nhật này con bận thì cứ lo việc của con đi, mẹ ở nhà một mình cũng quen rồi, khỏi cần về ăn cơm với mẹ đâu.';
const MESSAGES = [STUB, 'Không sao đâu', PANEL115];
const ROLES = [
  { srv: 'lover', cli: 'Người yêu' },
  { srv: 'coworker', cli: 'Đồng nghiệp' },
  { srv: 'boss', cli: 'Sếp' },
  { srv: 'friend', cli: 'Bạn thân' },
];
const LEAK_MARKERS = ['con lo', 'Con lớn rồi', 'để con gọi về', 'cả nhà mình', 'gọi về'];
const SELF_CON_PATTERN = /\bcon\b/;

const stripQuotes = (s) => s.replace(/“[^”]*”/g, '').replace(/"[^"]*"/g, '');

function assertNoLeak(r, label) {
  const fields = {
    meaning: stripQuotes(r.meaning),
    realWant: stripQuotes(r.realWant),
    replies: stripQuotes(r.replies.map((x) => x.text).join('\n')),
  };
  for (const [field, text] of Object.entries(fields)) {
    for (const marker of LEAK_MARKERS) {
      assert.ok(!text.includes(marker), `${label} ${field} còn marker "${marker}": ${text}`);
    }
    assert.ok(
      !SELF_CON_PATTERN.test(text),
      `${label} ${field} còn tự xưng «con»: ${text}`,
    );
  }
}

test('Sprint2/S2: ma trận vai ngoài gia đình × 3 tin × 2 engine — sạch văn phong bố mẹ', () => {
  for (const role of ROLES) {
    for (const message of MESSAGES) {
      const srv = translateDichbome({ message, speaker: role.srv, context: 'khac' });
      assertNoLeak(srv, `server/${role.srv}/${message.slice(0, 16)}`);
      const cli = translateParentMessage({ message, speaker: role.cli, context: 'Khác' });
      assertNoLeak(cli, `client/${role.cli}/${message.slice(0, 16)}`);
    }
  }
});

test('Sprint2/S2: replies biến thể khớp nguyên văn Lens 1 §3.3 (Đồng nghiệp + Người yêu)', () => {
  const coworkerStub = translateDichbome({ message: STUB, speaker: 'coworker', context: 'khac' });
  assert.deepEqual(
    coworkerStub.replies.map((x) => x.text),
    [
      'Mình cũng đang phân vân thật. Bạn thấy phương án nào hợp hơn thì góp ý cho mình một tiếng, mình theo ý bạn cũng được.',
      'Cảm ơn bạn. Mình đang nghiêng về một cách rồi, mình nói bạn nghe thử nhé — thấy chỗ nào chưa ổn bạn chỉ mình luôn.',
      'Chuyện này mình chưa chốt vội đâu. Mình xem lại một lượt rồi chiều nay nhắn lại bạn một câu chốt hẳn, khỏi để bạn phải chờ lâu.',
    ],
  );
  const loverStub = translateParentMessage({ message: STUB, speaker: 'Người yêu', context: 'Khác' });
  assert.deepEqual(
    loverStub.replies.map((x) => x.text),
    [
      'Anh cũng đang phân vân nè. Em thấy cách nào hợp hơn thì nói anh nghe, em chọn giúp anh một cái đi.',
      'Cảm ơn em đã để anh quyết. Anh đang tính thế này, em nghe thử xem có ổn không, thiếu gì em bảo anh nhé.',
      'Anh chưa quyết vội đâu. Tối nay anh gọi cho em, hai đứa mình bàn với nhau một lúc rồi anh chốt luôn, nghe em.',
    ],
  );
  const coworkerNoSao = translateParentMessage({
    message: 'Không sao đâu',
    speaker: 'Đồng nghiệp',
    context: 'Khác',
  });
  assert.deepEqual(
    coworkerNoSao.replies.map((x) => x.text),
    [
      'Thật không bạn? Có chuyện gì bạn cứ kể mình nghe, mình nghe hết — cần thì mình hỗ trợ trong phần việc của mình.',
      'Bạn cứ nói thật với mình nhé. Chuyện liên quan tới việc chung thì mình càng cần biết đúng để còn xử lý cùng bạn.',
      'Vậy để mình gọi cho bạn nói chuyện một lúc nhé. Nghe bạn nói rõ đầu đuôi mình mới yên tâm là không còn gì vướng.',
    ],
  );
  const loverNoSao = translateDichbome({ message: 'Không sao đâu', speaker: 'lover', context: 'khac' });
  assert.deepEqual(
    loverNoSao.replies.map((x) => x.text),
    [
      'Thật không em? Có gì em cứ kể anh nghe đi, anh ở đây nghe em hết, không để em giữ trong lòng một mình đâu.',
      'Em cứ nói thật với anh nhé. Chuyện gì anh cũng nghe được — miễn là em đừng giấu anh rồi tự chịu một mình.',
      'Vậy tối nay anh gọi cho em một lúc nhé. Nghe giọng em anh mới yên tâm được.',
    ],
  );
});

test('Sprint2/R2: xưng hô nhất quán trong thân biến thể Người yêu + Bạn thân (2 entry × 2 engine)', () => {
  // Người yêu: tự xưng khớp {s} = «anh» (giữ nguyên «một mình», «hai đứa mình»).
  const loverTuyCon = [
    'Anh cũng đang phân vân nè. Em thấy cách nào hợp hơn thì nói anh nghe, em chọn giúp anh một cái đi.',
    'Cảm ơn em đã để anh quyết. Anh đang tính thế này, em nghe thử xem có ổn không, thiếu gì em bảo anh nhé.',
    'Anh chưa quyết vội đâu. Tối nay anh gọi cho em, hai đứa mình bàn với nhau một lúc rồi anh chốt luôn, nghe em.',
  ];
  assert.deepEqual(
    translateDichbome({ message: STUB, speaker: 'lover', context: 'khac' }).replies.map((x) => x.text),
    loverTuyCon,
  );
  const loverKhongSao = [
    'Thật không em? Có gì em cứ kể anh nghe đi, anh ở đây nghe em hết, không để em giữ trong lòng một mình đâu.',
    'Em cứ nói thật với anh nhé. Chuyện gì anh cũng nghe được — miễn là em đừng giấu anh rồi tự chịu một mình.',
    'Vậy tối nay anh gọi cho em một lúc nhé. Nghe giọng em anh mới yên tâm được.',
  ];
  assert.deepEqual(
    translateParentMessage({ message: 'Không sao đâu', speaker: 'Người yêu', context: 'Khác' }).replies.map(
      (x) => x.text,
    ),
    loverKhongSao,
  );
  // Bạn thân: tự xưng «mình», gọi đối phương «bạn» (không còn «tớ/cậu»).
  const friendTuyCon = [
    'Mình cũng đang phân vân đây. Bạn thấy cách nào hợp hơn thì phán giúp mình một câu đi.',
    'Cảm ơn bạn đã nhường mình quyết. Mình đang tính thế này, bạn nghe thử nhé — thấy chỗ nào chưa ổn thì bạn nói thẳng luôn.',
    'Chuyện này mình chưa chốt vội đâu. Tối mình gọi buôn với bạn một lúc, hai đứa ngồi lại tính với nhau rồi mình chốt.',
  ];
  assert.deepEqual(
    translateDichbome({ message: STUB, speaker: 'friend', context: 'khac' }).replies.map((x) => x.text),
    friendTuyCon,
  );
  assert.deepEqual(
    translateParentMessage({ message: STUB, speaker: 'Bạn thân', context: 'Khác' }).replies.map((x) => x.text),
    friendTuyCon,
  );
  const friendKhongSao = [
    'Thật không bạn? Có chuyện gì bạn cứ kể mình nghe, mình nghe hết — bạn bè mà giấu nhau là mình giận thật đấy.',
    'Bạn cứ nói thật với mình nhé. Chuyện gì mình cũng nghe được — đừng giấu rồi tự chịu một mình, nghe chưa.',
    'Vậy tối mình gọi buôn với bạn một lúc nhé. Nghe giọng bạn mình mới yên tâm là không còn gì vướng.',
  ];
  assert.deepEqual(
    translateDichbome({ message: 'Không sao đâu', speaker: 'friend', context: 'khac' }).replies.map((x) => x.text),
    friendKhongSao,
  );
  assert.deepEqual(
    translateParentMessage({ message: 'Không sao đâu', speaker: 'Bạn thân', context: 'Khác' }).replies.map(
      (x) => x.text,
    ),
    friendKhongSao,
  );
});

test('Sprint2/R1: CONTEXT_HINTS client chỉ nối cho vai bố/mẹ — Người yêu + Về quê không rò khung bố mẹ', () => {
  const lover = translateParentMessage({ message: PANEL115, speaker: 'Người yêu', context: 'Về quê' });
  assert.ok(!lover.realWant.includes('bố mẹ nghe ngày tháng'), lover.realWant);
  const mother = translateParentMessage({ message: PANEL115, speaker: 'Mẹ', context: 'Về quê' });
  assert.ok(mother.realWant.includes('bố mẹ nghe ngày tháng'), mother.realWant);
});

test('Sprint2/S2: biến thể không đổi anger + nhãn replies theo index', () => {
  // Server: nhãn cố định DICHBOME_REPLY_LABELS; anger của entry gốc giữ nguyên.
  const base = translateDichbome({ message: STUB, speaker: 'me', context: 'khac' });
  const variant = translateDichbome({ message: STUB, speaker: 'boss', context: 'khac' });
  assert.deepEqual(
    variant.replies.map((x) => x.label),
    base.replies.map((x) => x.label),
  );
  assert.equal(variant.angerLevel, base.angerLevel);
  // Client: nhãn replies của rule gốc theo từng index (tuy-con có nhãn riêng).
  const cliBase = translateParentMessage({ message: STUB, speaker: 'Mẹ', context: 'Khác' });
  const cliVariant = translateParentMessage({ message: STUB, speaker: 'Sếp', context: 'Khác' });
  assert.deepEqual(
    cliVariant.replies.map((x) => x.label),
    cliBase.replies.map((x) => x.label),
  );
  assert.deepEqual(
    cliVariant.replies.map((x) => x.label),
    ['An toàn nhất', 'Thân tình', 'Hài hước'],
  );
  assert.equal(cliVariant.angerLevel, cliBase.angerLevel);
});
