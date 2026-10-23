// Honesty layer (redesign-v2) — W2: tầng trung thực engine.
// Chạy: pnpm test
// Các module lá (engine server, translate client, server-patterns) không có import nội bộ
// nên import tĩnh bằng đường dẫn .ts như tests cũ. honesty.ts và api/mock.ts dùng import
// nội bộ không đuôi đúng chuẩn codebase Next/TS ('./translate', '../lib/translate') —
// Node ESM không tự resolve kiểu đó, nên test này đăng ký một loader ESM nhỏ (chỉ trong
// tiến trình test) để resolve specifier tương đối không đuôi sang file .ts/.tsx tương ứng,
// rồi import động honesty/mock SAU khi đăng ký. Code production không bị ảnh hưởng.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import {
  translateDichbome,
  classifyDichbomeInput,
  getEntryPatterns,
} from '../lib/server/engine.ts';
import {
  translateParentMessage,
  normalizeVi as normalizeClient,
  matchRuleInfo,
  CLIENT_RULE_KEYS,
} from '../components/dichbome/lib/translate.ts';
import {
  SERVER_ENTRY_PATTERNS,
  SERVER_EXACT_PATTERNS,
} from '../components/dichbome/lib/server-patterns.ts';

const loaderSource = `
export async function resolve(specifier, context, nextResolve) {
  if (
    (specifier.startsWith('./') || specifier.startsWith('../')) &&
    !/\\.(ts|tsx|js|mjs|cjs|json)$/.test(specifier)
  ) {
    try {
      return await nextResolve(specifier + '.ts', context);
    } catch {}
    try {
      return await nextResolve(specifier + '.tsx', context);
    } catch {}
  }
  return nextResolve(specifier, context);
}
`;
register(`data:text/javascript,${encodeURIComponent(loaderSource)}`, import.meta.url);

const {
  INTERJECTION_EXACT,
  hasKnownToken,
  isRecognizedCurt,
  evaluateClient,
  gateForServer,
  gateForDevice,
} = await import('../components/dichbome/lib/honesty.ts');
const { createMockDichbomeApi } = await import('../components/dichbome/api/mock.ts');

test('honesty: chuỗi vô nghĩa -> match null, không có token nào được nhận biết, gate not-read', () => {
  const r = evaluateClient('asdf qwer zxcv 123', 'Mẹ');
  assert.equal(r.match, null);
  assert.equal(r.hasKnownToken, false);
  assert.equal(r.isCurt, false);
  assert.equal(gateForDevice(r.match, r.isCurt), 'not-read');
});

test('honesty: hasKnownToken khớp nguyên token, không khớp substring', () => {
  // 'dax'/'xda' chứa substring 'da' (một pattern exact) nhưng không phải token 'da'.
  assert.equal(hasKnownToken('dax'), false);
  assert.equal(hasKnownToken('xda'), false);
  assert.equal(hasKnownToken('da'), true);
});

test('honesty: "Ừ" là câu cụt được nhận biết — server classify entry, không bị chặn', () => {
  const meta = classifyDichbomeInput({ message: 'Ừ', speaker: 'me' });
  assert.equal(meta.matchKind, 'entry');
  assert.equal(isRecognizedCurt(normalizeClient('Ừ')), true);
  // Phía client: không khớp rule, nhưng là câu cụt thật -> đi đường low-direct, không phải not-read.
  const r = evaluateClient('Ừ', 'Mẹ');
  assert.equal(r.match, null);
  assert.equal(r.isCurt, true);
  assert.equal(gateForDevice(r.match, r.isCurt), 'low-direct');
});

test('honesty: INTERJECTION_EXACT gồm patterns exact của server + ok + "u u"', () => {
  for (const p of SERVER_EXACT_PATTERNS) {
    assert.ok(INTERJECTION_EXACT.includes(p), `thiếu pattern exact của server: ${p}`);
  }
  assert.ok(INTERJECTION_EXACT.includes('ok'));
  assert.ok(INTERJECTION_EXACT.includes('u u'));
  assert.equal(isRecognizedCurt('u u'), true);
  assert.equal(isRecognizedCurt('ok'), true);
  assert.equal(isRecognizedCurt('u u u'), false);
});

test('honesty: câu tiếng Việt thật chưa có rule -> match null nhưng hasKnownToken true, gate not-read', () => {
  const r = evaluateClient('Mai mẹ qua nhà con chơi nhé', 'Mẹ');
  assert.equal(r.match, null);
  assert.equal(r.hasKnownToken, true);
  assert.equal(gateForDevice(r.match, r.isCurt), 'not-read');
});

test('honesty: "Tùy con, mẹ sao cũng được." (Mẹ) khớp rule chung -> roleSpecific false', () => {
  const r = evaluateClient('Tùy con, mẹ sao cũng được.', 'Mẹ');
  assert.ok(r.match !== null);
  assert.equal(r.match.ruleId, 'tuy-con');
  assert.equal(r.match.roleSpecific, false);
  assert.equal(gateForDevice(r.match, r.isCurt), 'full');
  // matchRuleInfo trực tiếp cho cùng kết quả.
  assert.deepEqual(matchRuleInfo('Tùy con, mẹ sao cũng được.', 'Mẹ'), {
    ruleId: 'tuy-con',
    roleSpecific: false,
  });
});

test('honesty: "Em không sao, anh tự hiểu đi." (Vợ) khớp rule gắn vai -> roleSpecific true', () => {
  const r = evaluateClient('Em không sao, anh tự hiểu đi.', 'Vợ');
  assert.ok(r.match !== null);
  assert.equal(r.match.roleSpecific, true);
});

test('honesty: CLIENT_RULE_KEYS chứa các khoá quen thuộc của RULES', () => {
  assert.ok(CLIENT_RULE_KEYS.length > 0);
  assert.ok(CLIENT_RULE_KEYS.includes('tuy con'));
  assert.ok(CLIENT_RULE_KEYS.includes('em khong sao'));
});

test('honesty: server classify — câu có entry -> entry, câu không có -> fallback', () => {
  assert.deepEqual(classifyDichbomeInput({ message: 'Tuỳ con, mẹ sao cũng được', speaker: 'me' }), {
    matchKind: 'entry',
    roleSpecific: false,
  });
  assert.deepEqual(classifyDichbomeInput({ message: 'Hôm nay trời đẹp quá đi', speaker: 'me' }), {
    matchKind: 'fallback',
    roleSpecific: false,
  });
  // Entry gắn đúng vai vợ -> roleSpecific true.
  const wife = classifyDichbomeInput({ message: 'Em không sao, anh tự hiểu đi', speaker: 'wife' });
  assert.equal(wife.matchKind, 'entry');
  assert.equal(wife.roleSpecific, true);
});

test('honesty: gateForServer — entry full, fallback phân theo curt, meta undefined -> full', () => {
  assert.equal(gateForServer({ matchKind: 'entry', roleSpecific: false }, false), 'full');
  assert.equal(gateForServer({ matchKind: 'entry', roleSpecific: true }, false), 'full');
  assert.equal(gateForServer({ matchKind: 'fallback', roleSpecific: false }, true), 'low-direct');
  assert.equal(gateForServer({ matchKind: 'fallback', roleSpecific: false }, false), 'not-read');
  // Phân xử đã ghi trong honesty.ts: meta thiếu (API không phải route của repo này) -> 'full'
  // để tránh chặn nhầm toàn bộ kết quả ở đường legacy.
  assert.equal(gateForServer(undefined, false), 'full');
  assert.equal(gateForServer(undefined, true), 'full');
});

test('honesty: gateForDevice — có match -> full, không match phân theo curt', () => {
  assert.equal(gateForDevice({ roleSpecific: false }, false), 'full');
  assert.equal(gateForDevice({ roleSpecific: true }, false), 'full');
  assert.equal(gateForDevice(null, true), 'low-direct');
  assert.equal(gateForDevice(null, false), 'not-read');
});

test('honesty: drift — snapshot SERVER_ENTRY_PATTERNS khớp getEntryPatterns()', () => {
  const entries = getEntryPatterns();
  const liveAll = [...new Set(entries.flatMap((e) => e.patterns))].sort();
  const snapAll = [...new Set(SERVER_ENTRY_PATTERNS)].sort();
  assert.deepEqual(snapAll, liveAll);
  const liveExact = [...new Set(entries.filter((e) => e.exact).flatMap((e) => e.patterns))].sort();
  const snapExact = [...new Set(SERVER_EXACT_PATTERNS)].sort();
  assert.deepEqual(snapExact, liveExact);
});

test('honesty: mock API trả kèm meta từ matchRuleInfo phía client', async () => {
  const api = createMockDichbomeApi();
  const hit = await api.translate({
    message: 'Tùy con, mẹ sao cũng được.',
    speaker: 'Mẹ',
    context: 'Khác',
  });
  assert.deepEqual(hit.meta, { matchKind: 'entry', roleSpecific: false });
  assert.equal(hit.replies.length, 3);
  const miss = await api.translate({
    message: 'asdf qwer zxcv 123',
    speaker: 'Mẹ',
    context: 'Khác',
  });
  assert.deepEqual(miss.meta, { matchKind: 'fallback', roleSpecific: false });
});

test('honesty: bất biến thuật toán — kết quả dịch giữ nguyên các khẳng định của baseline', () => {
  const s = translateDichbome({ message: 'Tuỳ con', speaker: 'me', context: 'khac' });
  const c = translateParentMessage({ message: 'Tuỳ con', speaker: 'Mẹ', context: 'Khác' });
  assert.ok(s.meaning.length > 0 && c.meaning.length > 0);
  assert.equal(s.replies.length, 3);
  assert.equal(c.replies.length, 3);
  assert.ok(s.angerLevel >= 0 && s.angerLevel <= 100);
  assert.ok(c.angerLevel >= 0 && c.angerLevel <= 5);
  const samples = [
    { message: 'Ăn cơm chưa con?', speaker: 'Bố', context: 'Khác' },
    { message: 'Em không sao, anh tự hiểu đi.', speaker: 'Vợ', context: 'Khác' },
    { message: 'asdf qwer zxcv 123', speaker: 'Mẹ', context: 'Khác' },
  ];
  for (const input of samples) {
    const r = translateParentMessage(input);
    assert.equal(r.replies.length, 3, `client replies != 3 cho ${JSON.stringify(input.message)}`);
    assert.ok(r.angerLevel >= 0 && r.angerLevel <= 5);
    assert.ok(typeof r.dangerLabel === 'string' && r.dangerLabel.length > 0);
  }
});
