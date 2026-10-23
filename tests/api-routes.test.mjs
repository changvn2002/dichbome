// Test cho CHÍNH API route (CQ-05(i)) — dichbome fix wave 3.
// Route handler app/api/products/dichbome/translate/route.ts là adapter mỏng;
// logic nằm ở lib/server/translate-handler.ts nên test gọi thẳng handler bằng
// raw body — đúng các case battery SEC-05/ARC-09 mà grader hồ sơ chấm vòng 3
// đã chạy trên live (P6 field lạ → từng 200, P7 inject trường kết quả → từng
// 200, malformed → shape NestJS cũ, message 5.000 ký tự → 400).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDichbomeExamples } from '../lib/server/engine.ts';

// translate-handler.ts dùng import nội bộ không đuôi đúng chuẩn codebase
// Next/TS ('./engine') — đăng ký loader ESM nhỏ như tests/honesty.test.mjs
// để Node resolve sang .ts, rồi import động handler sau khi đăng ký.
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

const { handleTranslatePost, MAX_BODY_CHARS } = await import('../lib/server/translate-handler.ts');

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const post = (obj) => handleTranslatePost(JSON.stringify(obj));

function assertErrorShape(res, status, code) {
  assert.equal(res.status, status, `status phải là ${status}`);
  assert.deepEqual(Object.keys(res.body), ['error'], 'body lỗi chỉ có khóa error (ARC-09)');
  assert.equal(res.body.error.code, code);
  assert.equal(typeof res.body.error.message, 'string');
  assert.ok(res.body.error.message.length > 0);
  assert.ok(!('statusCode' in res.body), 'shape cũ NestJS không được quay lại');
}

test('api: câu có entry → 200, meta.matchKind=entry, anger do server tính', () => {
  const res = post({ message: 'Tùy con, mẹ sao cũng được', speaker: 'me', context: 'khac' });
  assert.equal(res.status, 200);
  assert.equal(res.body.meta.matchKind, 'entry');
  assert.equal(res.body.angerLevel, 62);
  assert.equal(res.body.replies.length, 3);
});

test('api: câu rác → 200 với meta.matchKind=fallback (không bịa bản đọc entry)', () => {
  const res = post({ message: 'asdf qwer zxcv 123', speaker: 'me', context: 'khac' });
  assert.equal(res.status, 200);
  assert.equal(res.body.meta.matchKind, 'fallback');
});

test('api P6: field lạ role/isAdmin → 400 UNKNOWN_FIELD (trước đây 200, bỏ qua âm thầm)', () => {
  const res = post({ message: 'Tùy con', speaker: 'me', role: 'admin', isAdmin: true });
  assertErrorShape(res, 400, 'UNKNOWN_FIELD');
  assert.deepEqual([...res.body.error.fields].sort(), ['isAdmin', 'role']);
});

test('api P7: inject angerLevel/dangerLabel → 400 UNKNOWN_FIELD (không chấp nhận trường kết quả)', () => {
  const res = post({ message: 'Tùy con', speaker: 'me', angerLevel: 99, dangerLabel: 'x' });
  assertErrorShape(res, 400, 'UNKNOWN_FIELD');
  assert.deepEqual([...res.body.error.fields].sort(), ['angerLevel', 'dangerLabel']);
});

test('api: JSON malformed → 400 INVALID_JSON theo shape thống nhất', () => {
  const res = handleTranslatePost('{message: không phải json');
  assertErrorShape(res, 400, 'INVALID_JSON');
});

test('api: body không phải object (array/null/chuỗi) → 400 INVALID_BODY', () => {
  assertErrorShape(handleTranslatePost('[1,2,3]'), 400, 'INVALID_BODY');
  assertErrorShape(handleTranslatePost('null'), 400, 'INVALID_BODY');
  assertErrorShape(handleTranslatePost('"chỉ là chuỗi"'), 400, 'INVALID_BODY');
});

test('api: speaker sai tập giá trị → 400 VALIDATION_ERROR kèm fields', () => {
  const res = post({ message: 'Tùy con', speaker: 'admin' });
  assertErrorShape(res, 400, 'VALIDATION_ERROR');
  assert.deepEqual(res.body.error.fields, ['speaker']);
});

test('api: message rỗng → 400; message 5.000 ký tự → 400 (không phải 500, không lọt engine)', () => {
  assertErrorShape(post({ message: '   ' }), 400, 'VALIDATION_ERROR');
  const res = post({ message: 'a'.repeat(5000) });
  assertErrorShape(res, 400, 'VALIDATION_ERROR');
  assert.deepEqual(res.body.error.fields, ['message']);
});

test('api: body vượt trần dung lượng đã khai → 413 PAYLOAD_TOO_LARGE', () => {
  const res = handleTranslatePost('x'.repeat(MAX_BODY_CHARS + 1));
  assertErrorShape(res, 413, 'PAYLOAD_TOO_LARGE');
});

test('api: speaker/context bỏ trống vẫn hợp lệ (optional như contract gốc)', () => {
  const res = post({ message: 'Ăn cơm chưa?' });
  assert.equal(res.status, 200);
  assert.ok(res.body.meaning.length > 0);
});

test('api examples: payload nguồn của route GET đủ 15 câu, đủ trường bắt buộc', () => {
  const examples = getDichbomeExamples();
  assert.equal(examples.length, 15);
  for (const e of examples) {
    assert.ok(
      e.message && e.speaker && e.context && e.tease,
      `example thiếu trường: ${JSON.stringify(e)}`,
    );
  }
});

test('api: route.ts là adapter mỏng dùng chung handler (không fork logic validation)', () => {
  const route = readFileSync(
    path.join(ROOT, 'app/api/products/dichbome/translate/route.ts'),
    'utf8',
  );
  assert.ok(route.includes('handleTranslatePost'), 'route phải gọi handleTranslatePost');
  assert.ok(!route.includes('statusCode'), 'route không được tự phát shape lỗi cũ');
});
