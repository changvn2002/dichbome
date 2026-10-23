// Evidence tests W4 — dichbome dual-engine parity. NO product code modified.
// Run: node --test tests-evidence/engine-parity.test.mjs  (Node v24 type-stripping imports .ts)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  translateDichbome,
  normalizeVi as normalizeServer,
  DICHBOME_EXAMPLES,
  canonicalSpeaker,
} from '../lib/server/engine.ts';
import {
  translateParentMessage,
  normalizeVi as normalizeClient,
  PARENT_EXAMPLES,
} from '../components/dichbome/lib/translate.ts';

// Mapping UI label -> server code, copied from components/dichbome/api/http.ts (SPEAKER_CODE_BY_ROLE / CONTEXT_CODE_BY_LABEL)
const SPEAKER = {
  Mẹ: 'me',
  Bố: 'bo',
  'Cả hai': 'both',
  Con: 'child',
  'Mẹ chồng': 'mother-in-law',
  'Mẹ vợ': 'mother-of-wife',
  'Nàng dâu': 'daughter-in-law',
  'Con rể': 'son-in-law',
  Vợ: 'wife',
  Chồng: 'husband',
  'Anh/Chị': 'older-sibling',
  Em: 'younger-sibling',
  'Người yêu': 'lover',
  Sếp: 'boss',
  'Đồng nghiệp': 'coworker',
  'Bạn thân': 'friend',
};
const CONTEXT = {
  'Xin tiền': 'tien',
  'Về quê': 've-que',
  'Công việc': 'cong-viec',
  'Người yêu': 'nguoi-yeu',
  'Cưới hỏi': 'cuoi',
  'Sức khoẻ': 'suc-khoe',
  'Ở chung': 'o-chung',
  'Con cái': 'con-cai',
  Khác: 'khac',
};

test('sanity: both engines return a result for a common phrase', () => {
  const s = translateDichbome({ message: 'Tuỳ con', speaker: 'me', context: 'khac' });
  const c = translateParentMessage({ message: 'Tuỳ con', speaker: 'Mẹ', context: 'Khác' });
  assert.ok(s.meaning.length > 0 && c.meaning.length > 0);
  assert.equal(s.replies.length, 3);
  assert.equal(c.replies.length, 3);
});

test('normalizeVi: server and client produce identical normalized text', () => {
  const samples = ['Mẹ ơi! Con về...', 'Tuỳ con!!!', 'Ăn cơm chưa?', 'ĐỪNG có về nữa...'];
  for (const s of samples) {
    assert.equal(
      normalizeServer(s),
      normalizeClient(s),
      `normalize mismatch for ${JSON.stringify(s)}: server=${JSON.stringify(normalizeServer(s))} client=${JSON.stringify(normalizeClient(s))}`,
    );
  }
});

test('parity: same input via server vs client fallback gives same meaning', () => {
  const cases = [
    { message: 'Tuỳ con', speaker: 'Mẹ', context: 'Khác' },
    { message: 'Con bận', speaker: 'Con', context: 'Khác' },
    { message: 'Mẹ ăn cơm rồi', speaker: 'Mẹ', context: 'Sức khoẻ' },
    { message: 'Khi nào về quê?', speaker: 'Mẹ', context: 'Về quê' },
    { message: 'Ừ', speaker: 'Mẹ', context: 'Khác' },
  ];
  const diffs = [];
  for (const c of cases) {
    const s = translateDichbome({
      message: c.message,
      speaker: SPEAKER[c.speaker],
      context: CONTEXT[c.context],
    });
    const cl = translateParentMessage(c);
    if (s.meaning !== cl.meaning) diffs.push(`${c.message}: server!=client meaning`);
  }
  assert.deepEqual(
    diffs,
    [],
    `${diffs.length}/${cases.length} cases diverge: ${diffs.join(' | ')}`,
  );
});

test('parity: anger scale — client result equals server result normalized 0-100 -> 0-5 (http.ts rule)', () => {
  const s = translateDichbome({ message: 'Tuỳ con', speaker: 'me', context: 'khac' });
  const cl = translateParentMessage({ message: 'Tuỳ con', speaker: 'Mẹ', context: 'Khác' });
  const normalized = s.angerLevel > 5 ? Math.round((s.angerLevel / 100) * 5) : s.angerLevel;
  assert.equal(
    cl.angerLevel,
    Math.min(5, Math.max(0, normalized)),
    `server anger=${s.angerLevel} (norm ${normalized}) vs client=${cl.angerLevel}`,
  );
});

test('examples: server and client example sets are identical (message+speaker+context)', () => {
  const sSet = DICHBOME_EXAMPLES.map((e) => `${e.message}|${e.speaker}|${e.context}`).sort();
  const cSet = PARENT_EXAMPLES.map(
    (e) => `${e.message}|${SPEAKER[e.speaker]}|${CONTEXT[e.context]}`,
  ).sort();
  assert.deepEqual(cSet, sSet, `server ${sSet.length} vs client ${cSet.length} examples`);
});

test('engine validation: translateDichbome rejects >500 chars (route limit) at engine level', () => {
  assert.throws(
    () => translateDichbome({ message: 'a'.repeat(501), speaker: 'me', context: 'khac' }),
    /500/,
  );
});

test('engine validation: translateParentMessage rejects empty message like the local API does', () => {
  // local.ts: if (!input.message?.trim()) throw new Error('Chưa có tin nhắn để dịch.')
  assert.throws(() => translateParentMessage({ message: '   ', speaker: 'Mẹ', context: 'Khác' }));
});

test('canonicalSpeaker folds mom/dad/parents aliases', () => {
  assert.equal(canonicalSpeaker('mom'), 'me');
  assert.equal(canonicalSpeaker('dad'), 'bo');
  assert.equal(canonicalSpeaker('parents'), 'both');
});
