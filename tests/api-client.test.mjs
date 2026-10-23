// CQ-05 (fix wave 4): test khoá TRỰC TIẾP cho lib/api.ts (wrapper fetch +
// parse lỗi phía client) — trước đây chỉ được khoá gián tiếp qua handler
// phía server trong api-routes.test.mjs. Test chạy với fetch giả lập, không
// chạm mạng; contract khoá ở đây là đúng những gì ARC-09/SEC-12 yêu cầu:
//   - error shape thống nhất { error: { code, message, fields? } } được đọc
//     đúng; vẫn đọc được field message rời của backend tương thích;
//   - KHÔNG còn đường credential nào (SEC-12): wrapper không gắn
//     Authorization và không đọc localStorage — kiểm bằng cách khẳng định
//     headers gửi đi không chứa khoá nào ngoài Content-Type khi có body.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { api, apiBase } from '../lib/api.ts';

function stubFetch(response) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return response;
  };
  return calls;
}

function fakeResponse({ ok = true, status = 200, statusText = 'OK', body = '' }) {
  return { ok, status, statusText, text: async () => body };
}

test('api-client: apiBase mặc định rỗng; NEXT_PUBLIC_API_URL được cắt dấu / cuối', () => {
  const saved = process.env.NEXT_PUBLIC_API_URL;
  delete process.env.NEXT_PUBLIC_API_URL;
  assert.equal(apiBase(), '');
  process.env.NEXT_PUBLIC_API_URL = 'https://example.com/';
  assert.equal(apiBase(), 'https://example.com');
  if (saved === undefined) delete process.env.NEXT_PUBLIC_API_URL;
  else process.env.NEXT_PUBLIC_API_URL = saved;
});

test('api-client: 200 + JSON → trả dữ liệu đã parse; URL = base + path', async () => {
  const calls = stubFetch(fakeResponse({ body: JSON.stringify({ hello: 'xin chào' }) }));
  const data = await api('/api/products/dichbome/examples');
  assert.deepEqual(data, { hello: 'xin chào' });
  assert.equal(calls[0].url, '/api/products/dichbome/examples');
});

test('api-client: 200 + body rỗng → undefined (không throw)', async () => {
  stubFetch(fakeResponse({ body: '' }));
  assert.equal(await api('/x'), undefined);
});

test('api-client: lỗi shape thống nhất {error:{message}} → throw đúng message', async () => {
  stubFetch(
    fakeResponse({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      body: JSON.stringify({ error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu chưa hợp lệ' } }),
    }),
  );
  await assert.rejects(() => api('/x'), /Dữ liệu chưa hợp lệ/);
});

test('api-client: lỗi field message rời (backend tương thích) — chuỗi và mảng đều đọc được', async () => {
  stubFetch(
    fakeResponse({ ok: false, status: 400, body: JSON.stringify({ message: 'Sai định dạng' }) }),
  );
  await assert.rejects(() => api('/x'), /Sai định dạng/);
  stubFetch(
    fakeResponse({
      ok: false,
      status: 400,
      body: JSON.stringify({ message: ['Thiếu message', 'Sai speaker'] }),
    }),
  );
  await assert.rejects(() => api('/x'), /Thiếu message, Sai speaker/);
});

test('api-client: lỗi không có message nào → fallback statusText', async () => {
  stubFetch(
    fakeResponse({ ok: false, status: 503, statusText: 'Service Unavailable', body: '{}' }),
  );
  await assert.rejects(() => api('/x'), /Service Unavailable/);
});

test('api-client: body JSON → Content-Type tự gắn; FormData → không gắn; header có sẵn → không ghi đè', async () => {
  let calls = stubFetch(fakeResponse({ body: '{}' }));
  await api('/x', { method: 'POST', body: JSON.stringify({ a: 1 }) });
  assert.equal(calls[0].init.headers.get('Content-Type'), 'application/json');

  calls = stubFetch(fakeResponse({ body: '{}' }));
  await api('/x', { method: 'POST', body: new FormData() });
  assert.equal(calls[0].init.headers.get('Content-Type'), null);

  calls = stubFetch(fakeResponse({ body: '{}' }));
  await api('/x', {
    method: 'POST',
    body: 'raw',
    headers: { 'Content-Type': 'text/plain' },
  });
  assert.equal(calls[0].init.headers.get('Content-Type'), 'text/plain');
});

test('api-client: SEC-12 — không gắn Authorization, không header lạ nào ngoài Content-Type', async () => {
  const calls = stubFetch(fakeResponse({ body: '{}' }));
  await api('/x', { method: 'POST', body: JSON.stringify({ a: 1 }) });
  const keys = [...calls[0].init.headers.keys()].map((k) => k.toLowerCase());
  assert.deepEqual(keys, ['content-type']);
  assert.equal(calls[0].init.headers.get('Authorization'), null);
});
