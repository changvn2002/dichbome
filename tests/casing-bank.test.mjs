// Casing bank scan — fix wave M-1 (Panel #02, finding M-1/D-5).
// Quét TOÀN BANK của cả 2 engine (server lib/server/engine.ts + client
// components/dichbome/lib/translate.ts): với mọi vai x mọi pattern, render
// meaning (Ý thật) + realWant (Điều muốn nghe) + warning + replies (câu gợi ý)
// bằng dữ liệu mẫu, khẳng định không chuỗi nào có câu bắt đầu bằng chữ thường
// sau dấu chấm/câu hỏi/chấm than, và không chuỗi nào mở đầu bằng chữ thường.
// Ngoại lệ có chủ đích: dấu ba chấm "..." / "…" là nối câu giữa chừng trong
// tiếng Việt (vd "hơi... sốt ruột") — chữ thường sau đó là đúng văn phong,
// không phải lỗi đầu câu, nên được chuẩn hoá đi trước khi quét.
// Lỗi gốc: 18 template server đặt {p} (giữ chữ thường) ở đầu câu sau ". "/"? ".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translateDichbome, getEntryPatterns } from '../lib/server/engine.ts';
import { translateParentMessage, CLIENT_RULE_KEYS } from '../components/dichbome/lib/translate.ts';

/** Trả về danh sách vị trí lỗi viết thường đầu câu trong một chuỗi render. */
function lowercaseSentenceStarts(text) {
  const hits = [];
  // Chuẩn hoá ellipsis: "..." và "…" là nối câu, không phải kết câu.
  const cleaned = text.replace(/\.\.\.+/g, '').replace(/…/g, '');
  for (const m of cleaned.matchAll(/[.?!]\s+(\p{Ll})/gu)) {
    hits.push(`sau dấu câu ở index ${m.index}: "${m[1]}"`);
  }
  const first = cleaned.replace(/^[\s"'“”‘’«»]+/u, '');
  if (/^\p{Ll}/u.test(first)) hits.push(`mở đầu chuỗi bằng chữ thường: "${first[0]}"`);
  return hits;
}

function scanResult(result, label, counter) {
  const fields = [
    ['meaning', result.meaning],
    ['realWant', result.realWant],
    ...(result.warning ? [['warning', result.warning]] : []),
    ...result.replies.map((r, i) => [`reply${i}`, r.text]),
  ];
  for (const [field, value] of fields) {
    counter.strings += 1;
    for (const hit of lowercaseSentenceStarts(value)) {
      counter.violations.push(`${label}/${field}: ${hit} :: ${value}`);
    }
  }
}

const SERVER_SPEAKERS = [
  'me',
  'bo',
  'both',
  'mom',
  'dad',
  'parents',
  'child',
  'mother-in-law',
  'mother-of-wife',
  'daughter-in-law',
  'son-in-law',
  'wife',
  'husband',
  'older-sibling',
  'younger-sibling',
  'lover',
  'boss',
  'coworker',
  'friend',
];
const SERVER_CONTEXTS = [
  'tien',
  've-que',
  'cong-viec',
  'nguoi-yeu',
  'cuoi',
  'suc-khoe',
  'o-chung',
  'con-cai',
  'khac',
];
const NEUTRAL_MESSAGE = 'Hôm nay nhà mình bàn chuyện này thật kỹ nhé mọi người ơi';
const CATEGORY_MESSAGES = [
  'Chuyện tiền bạc lương tháng này sao rồi',
  'Chuyện về quê ăn Tết giỗ họ năm nay',
  'Dạo này mệt ốm bệnh đi khám sức khoẻ suốt',
  'Chuyện cưới người yêu bạn gái ra mắt tính sao',
  'Chuyện công việc đi làm sếp giao nhiều quá',
  'Chuyện ăn cơm đói quá đi thôi',
];

test('casing: toàn bank server — không câu nào bắt đầu bằng chữ thường sau ./ ?/!', () => {
  const patterns = [...new Set(getEntryPatterns().flatMap((e) => e.patterns))];
  assert.ok(patterns.length >= 100, `snapshot pattern server quá mỏng: ${patterns.length}`);
  const counter = { strings: 0, violations: [] };
  for (const speaker of SERVER_SPEAKERS) {
    for (const pattern of patterns) {
      const r = translateDichbome({ message: pattern, speaker, context: 'khac' });
      scanResult(r, `server/${speaker}/${pattern}`, counter);
    }
    for (const context of SERVER_CONTEXTS) {
      const r = translateDichbome({ message: NEUTRAL_MESSAGE, speaker, context });
      scanResult(r, `server/${speaker}/ctx-${context}`, counter);
    }
    for (const message of CATEGORY_MESSAGES) {
      const r = translateDichbome({ message, speaker, context: 'khac' });
      scanResult(r, `server/${speaker}/cat`, counter);
    }
  }
  assert.ok(
    counter.strings >= 10000,
    `quét quá ít chuỗi server (${counter.strings}) — bank chưa được phủ hết`,
  );
  assert.deepEqual(counter.violations, []);
});

test('casing: hai chuỗi Panel #02 đã xác thực trên render phải viết hoa đúng', () => {
  // Chuỗi 1 (Ý thật): "…đang buồn. Mẹ/Bố nói vậy để con khỏi khó xử…"
  const buonMe = translateDichbome({
    message: 'Mẹ không buồn đâu, con cứ đi đi',
    speaker: 'me',
    context: 've-que',
  });
  assert.ok(buonMe.meaning.includes('đang buồn. Mẹ nói vậy'), buonMe.meaning);
  const buonBo = translateDichbome({
    message: 'Bố không buồn đâu, con cứ đi đi',
    speaker: 'bo',
    context: 've-que',
  });
  assert.ok(buonBo.meaning.includes('đang buồn. Bố nói vậy'), buonBo.meaning);
  // Chuỗi 2 (câu gợi ý "Ngoan nhất" — nội dung người dùng chép đi gửi người thân):
  // "…hợp hơn ạ? Mẹ/Bố góp ý cho con rồi con quyết."
  const tuyMe = translateDichbome({ message: 'Tùy con', speaker: 'me', context: 'khac' });
  assert.ok(tuyMe.replies[0].text.includes('hợp hơn ạ? Mẹ góp ý'), tuyMe.replies[0].text);
  const tuyBo = translateDichbome({ message: 'Tùy con', speaker: 'bo', context: 'khac' });
  assert.ok(tuyBo.replies[0].text.includes('hợp hơn ạ? Bố góp ý'), tuyBo.replies[0].text);
});

const CLIENT_ROLES = [
  'Mẹ',
  'Bố',
  'Cả hai',
  'Con',
  'Mẹ chồng',
  'Mẹ vợ',
  'Nàng dâu',
  'Con rể',
  'Vợ',
  'Chồng',
  'Anh/Chị',
  'Em',
  'Người yêu',
  'Sếp',
  'Đồng nghiệp',
  'Bạn thân',
];
const CLIENT_CONTEXTS = [
  'Xin tiền',
  'Về quê',
  'Công việc',
  'Người yêu',
  'Cưới hỏi',
  'Sức khoẻ',
  'Ở chung',
  'Con cái',
  'Khác',
];

test('casing: toàn bank client (offline) — không câu nào bắt đầu bằng chữ thường sau ./ ?/!', () => {
  assert.ok(CLIENT_RULE_KEYS.length >= 100, `keys client quá mỏng: ${CLIENT_RULE_KEYS.length}`);
  const counter = { strings: 0, violations: [] };
  for (const speaker of CLIENT_ROLES) {
    for (const key of CLIENT_RULE_KEYS) {
      const r = translateParentMessage({ message: key, speaker, context: 'Khác' });
      scanResult(r, `client/${speaker}/${key}`, counter);
    }
    for (const context of CLIENT_CONTEXTS) {
      const r = translateParentMessage({ message: NEUTRAL_MESSAGE, speaker, context });
      scanResult(r, `client/${speaker}/ctx-${context}`, counter);
    }
  }
  assert.ok(
    counter.strings >= 10000,
    `quét quá ít chuỗi client (${counter.strings}) — bank chưa được phủ hết`,
  );
  assert.deepEqual(counter.violations, []);
});
