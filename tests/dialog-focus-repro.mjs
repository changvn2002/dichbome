// FIN v1.4.1 — W-DIALOG: tái lập lỗi focus của ConfirmDialog lồng trong Board.
// KHÔNG phải test của suite (tên cố ý không khớp glob tests/*.test.mjs).
// Harness: Node CDP + /opt/meta-chromium, origin giả lập https://measure.local
// được fulfill từ server production local (tiền lệ dichbome-v2-verify/cdp.py
// và verifier-v2/measure.mjs). Tương tác bằng CDP Input thật (chuột/phím).
//
// Chạy:
//   REPRO_PHASE=before node tests/dialog-focus-repro.mjs
//   REPRO_PHASE=after  node tests/dialog-focus-repro.mjs
// Env: REPRO_LOCAL_PORT (mặc định 3231), REPRO_OUT (thư mục bằng chứng).
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const PHASE = process.env.REPRO_PHASE || 'run';
const OUT =
  process.env.REPRO_OUT || process.env.HOME + '/workspace/mini-apps/tmp/dichbome-fin-v141/dialog';
fs.mkdirSync(OUT, { recursive: true });
const APP = 'https://measure.local';
const LOCAL = 'http://127.0.0.1:' + (process.env.REPRO_LOCAL_PORT || '3231');
const CDP_PORT = 9461;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);
const R = { phase: PHASE, checks: {} };

const chrome = spawn(
  process.env.HOME + '/workspace/mini-apps/tmp/chrome-lna.sh',
  [
    '--headless=new',
    '--disable-gpu',
    '--remote-allow-origins=*',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${OUT}/profile-${PHASE}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
);

let ver;
for (let i = 0; i < 60; i++) {
  try {
    ver = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`)).json();
    break;
  } catch {
    await sleep(500);
  }
}
if (!ver) throw new Error('chrome did not start');
const ws = new WebSocket(ver.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  ws.onopen = res;
  ws.onerror = rej;
});
let nid = 1;
const pend = new Map();
const listeners = new Map();
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pend.has(m.id)) {
    const p = pend.get(m.id);
    pend.delete(m.id);
    if (m.error) p.reject(new Error(m.error.message + ' ' + (m.error.data || '')));
    else p.resolve(m.result);
  } else if (m.method) for (const f of listeners.get(m.method) || []) f(m.params, m.sessionId);
};
const send = (method, params = {}, sid) =>
  new Promise((resolve, reject) => {
    const id = nid++;
    pend.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, ...(sid ? { sessionId: sid } : {}) }));
  });
const on = (m, f) => {
  if (!listeners.has(m)) listeners.set(m, []);
  listeners.get(m).push(f);
};
const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
const S = (m, p) => send(m, p, sessionId);
await S('Page.enable');
await S('Runtime.enable');
await S('Network.enable');
await S('Fetch.enable', { patterns: [{ urlPattern: APP + '/*', requestStage: 'Request' }] });
on('Fetch.requestPaused', async (p, sid) => {
  const url = p.request.url;
  try {
    const path = url.slice(APP.length) || '/';
    let body, status, headers;
    if (path.startsWith('/sw.js')) {
      body = Buffer.from('// SW disabled during measurement\n');
      status = 200;
      headers = [{ name: 'Content-Type', value: 'application/javascript' }];
    } else {
      const hh = { ...p.request.headers };
      for (const k of Object.keys(hh))
        if (['host', 'content-length', 'connection'].includes(k.toLowerCase())) delete hh[k];
      const resp = await fetch(LOCAL + path, {
        method: p.request.method,
        headers: hh,
        redirect: 'manual',
        body: p.request.postData ? p.request.postData : undefined,
      });
      body = Buffer.from(await resp.arrayBuffer());
      status = resp.status;
      headers = [];
      resp.headers.forEach((v, k) => {
        if (!['content-length', 'connection', 'transfer-encoding'].includes(k.toLowerCase()))
          headers.push({ name: k, value: v });
      });
    }
    await send(
      'Fetch.fulfillRequest',
      {
        requestId: p.requestId,
        responseCode: status,
        responseHeaders: headers,
        body: body.toString('base64'),
      },
      sid,
    );
  } catch (e) {
    try {
      await send('Fetch.failRequest', { requestId: p.requestId, errorReason: 'Failed' }, sid);
    } catch {}
    log('fulfill error', url, String(e).slice(0, 200));
  }
});
const ev = async (expr) => {
  const r = await S('Runtime.evaluate', {
    expression: expr,
    returnByValue: true,
    awaitPromise: true,
  });
  if (r.exceptionDetails) log('EVAL EXC', JSON.stringify(r.exceptionDetails).slice(0, 500));
  return r.result?.value;
};
async function viewport(w, h) {
  await S('Emulation.setDeviceMetricsOverride', {
    width: w,
    height: h,
    deviceScaleFactor: 1,
    mobile: w < 600,
  });
  await S('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
}
async function navigate(path = '/') {
  await S('Page.navigate', { url: APP + path });
  await sleep(1800);
}
const bodyText = () => ev(`document.body ? document.body.textContent.replace(/\\s+/g,' ') : ''`);
async function waitForText(t, tries = 30) {
  for (let i = 0; i < tries; i++) {
    const b = await bodyText();
    if (b && b.includes(t)) return true;
    await sleep(600);
  }
  throw new Error('TIMEOUT waiting text: ' + t + ' :: ' + (await bodyText()).slice(0, 400));
}
const FIND = {
  btnExact: (t) =>
    `[...document.querySelectorAll('button')].find(b=>b.textContent.replace(/\\s+/g,' ').trim()===${JSON.stringify(t)})`,
  btnStarts: (t) =>
    `[...document.querySelectorAll('button')].find(b=>b.textContent.replace(/\\s+/g,' ').trim().startsWith(${JSON.stringify(t)}))`,
  tabStarts: (t) =>
    `[...document.querySelectorAll('[role="tab"]')].find(b=>b.textContent.replace(/\\s+/g,' ').trim().startsWith(${JSON.stringify(t)}))`,
};
async function rectOf(expr) {
  return ev(
    `(()=>{const el=${expr}; if(!el) return null; const r=el.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height,cx:r.x+r.width/2,cy:r.y+r.height/2, text:(el.textContent||'').replace(/\\s+/g,' ').trim().slice(0,80)};})()`,
  );
}
async function mouseClick(expr, label) {
  const r = await rectOf(expr);
  if (!r) throw new Error('mouseClick not found: ' + label);
  await S('Input.dispatchMouseEvent', { type: 'mouseMoved', x: r.cx, y: r.cy });
  await S('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x: r.cx,
    y: r.cy,
    button: 'left',
    clickCount: 1,
  });
  await S('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: r.cx,
    y: r.cy,
    button: 'left',
    clickCount: 1,
  });
  await sleep(500);
  log('mouseClick', label, JSON.stringify(r.text));
  return r;
}
// Như mouseClick nhưng cuộn phần tử vào giữa khung trước (nút nằm trong vùng
// cuộn nội bộ — toạ độ ngoài viewport thì click CDP không chạm được).
async function mouseClickScrolled(expr, label) {
  const ok = await ev(
    `(()=>{const el=${expr}; if(!el) return false; el.scrollIntoView({block:'center'}); return true;})()`,
  );
  if (!ok) throw new Error('mouseClickScrolled not found: ' + label);
  await sleep(350);
  return mouseClick(expr, label);
}
async function key(k, code, vk, modifiers = 0) {
  await S('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: k,
    code,
    windowsVirtualKeyCode: vk,
    nativeVirtualKeyCode: vk,
    modifiers,
  });
  await S('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: k,
    code,
    windowsVirtualKeyCode: vk,
    nativeVirtualKeyCode: vk,
    modifiers,
  });
  await sleep(180);
}
const focusInfo = () =>
  ev(
    `(()=>{const a=document.activeElement; if(!a) return {tag:'none'}; const d=document.querySelector('[role="dialog"]'); const as=document.querySelector('aside'); return {tag:a.tagName, text:(a.textContent||a.value||'').replace(/\\s+/g,' ').trim().slice(0,90), aria:a.getAttribute('aria-label'), insideDialog: !!(d&&d.contains(a)), insideAside: !!(as&&as.contains(a))};})()`,
  );
const dialogLabel = () =>
  ev(
    `(()=>{const d=document.querySelector('[role="dialog"]'); return d? d.getAttribute('aria-label'): null;})()`,
  );
const boardState = () =>
  ev(
    `(()=>{const as=document.querySelector('aside'); if(!as) return null; const cs=getComputedStyle(as); const tab=as.querySelector('[role="tab"][aria-selected="true"]'); return {visible: cs.visibility==='visible' && parseFloat(cs.opacity)>0.9, selectedTab: tab? tab.textContent.replace(/\\s+/g,' ').trim(): null, hasSavedTrigger: as.textContent.includes('Xoá toàn bộ kết quả đã lưu'), hasHistoryTrigger: as.textContent.includes('Xoá toàn bộ lịch sử')};})()`,
  );

async function freshState() {
  await navigate('/');
  await ev(`localStorage.clear(); 'cleared'`);
  await navigate('/');
  await waitForText('Người nhà vừa nhắn gì thế?');
}
async function seedViaUi() {
  // Dịch 1 câu (tạo 1 mục Lịch sử) rồi «Lưu kết quả» (tạo 1 mục Đã lưu).
  const r = await rectOf(`document.querySelector('textarea')`);
  await S('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x: r.cx,
    y: r.cy,
    button: 'left',
    clickCount: 1,
  });
  await S('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: r.cx,
    y: r.cy,
    button: 'left',
    clickCount: 1,
  });
  await S('Input.insertText', { text: 'Tùy con, mẹ sao cũng được.' });
  await sleep(400);
  await mouseClick(FIND.btnStarts('Dịch ý'), 'CTA Dịch ý');
  await waitForText('Ý thật');
  await sleep(2000);
  await mouseClickScrolled(FIND.btnExact('Lưu kết quả'), 'Lưu kết quả');
  await sleep(800);
  const savedBtn = await ev(
    `[...document.querySelectorAll('button')].some(b=>b.textContent.replace(/\\s+/g,' ').trim()==='Đã lưu')`,
  );
  log('seed: saved button now «Đã lưu» =', savedBtn);
  return savedBtn;
}
async function openBoardTab(tabStarts) {
  const bs = await boardState();
  if (!bs || !bs.visible) {
    await mouseClick(FIND.btnExact('Bảng'), 'mở Bảng');
    await sleep(700);
  }
  await mouseClick(FIND.tabStarts(tabStarts), 'tab ' + tabStarts);
  await sleep(700);
}

// Đo một ConfirmDialog: Tab×10 (đếm focus rời dialog), Escape×1 (dialog đóng?
// Board còn mở? focus về đâu?), mở lại + Huỷ (focus về trigger?).
async function dialogTest(name, tabStarts, triggerText, dialogTitle) {
  const out = { name, triggerText, dialogTitle };
  await openBoardTab(tabStarts);
  out.boardBefore = await boardState();
  await mouseClickScrolled(FIND.btnExact(triggerText), 'trigger ' + triggerText);
  await sleep(700);
  out.dialogOpenLabel = await dialogLabel();
  out.initialFocus = await focusInfo();
  out.tabSeq = [];
  for (let i = 0; i < 10; i++) {
    await key('Tab', 'Tab', 9);
    out.tabSeq.push(await focusInfo());
  }
  out.tabOutsideCount = out.tabSeq.filter((f) => !f.insideDialog).length;
  // Escape 1 lần
  await key('Escape', 'Escape', 27);
  await sleep(700);
  out.afterEscape = {
    dialogStillOpen: (await dialogLabel()) !== null,
    board: await boardState(),
    active: await focusInfo(),
  };
  out.afterEscape.focusIsTrigger =
    out.afterEscape.active.tag === 'BUTTON' && out.afterEscape.active.text === triggerText;
  // Mở lại (Board có thể đã bị đóng ở bản lỗi) rồi đóng bằng Huỷ
  await openBoardTab(tabStarts);
  await mouseClickScrolled(FIND.btnExact(triggerText), 'trigger lại ' + triggerText);
  await sleep(700);
  out.reopenLabel = await dialogLabel();
  await mouseClick(FIND.btnExact('Huỷ'), 'Huỷ ' + name);
  await sleep(700);
  out.afterCancel = {
    dialogClosed: (await dialogLabel()) === null,
    board: await boardState(),
    active: await focusInfo(),
  };
  out.afterCancel.focusIsTrigger =
    out.afterCancel.active.tag === 'BUTTON' && out.afterCancel.active.text === triggerText;
  log(
    name,
    JSON.stringify({
      tabOutsideCount: out.tabOutsideCount,
      escDialogStillOpen: out.afterEscape.dialogStillOpen,
      escBoardVisible: out.afterEscape.board?.visible,
      escFocusIsTrigger: out.afterEscape.focusIsTrigger,
      cancelFocusIsTrigger: out.afterCancel.focusIsTrigger,
    }),
  );
  return out;
}

try {
  await viewport(390, 844);
  await freshState();
  R.seedSaved = await seedViaUi();

  // ---- Hồi quy A: trap Board một mình (không dialog) ----
  await openBoardTab('Câu mẫu');
  const boardTabs = [];
  for (let i = 0; i < 8; i++) {
    await key('Tab', 'Tab', 9);
    boardTabs.push(await focusInfo());
  }
  R.checks.boardAloneTrap = {
    seq: boardTabs,
    outsideAsideCount: boardTabs.filter((f) => !f.insideAside).length,
  };
  log('boardAlone outsideAside =', R.checks.boardAloneTrap.outsideAsideCount);
  // đóng Board bằng nút X của Board để về sân khấu
  await mouseClick(
    `[...document.querySelectorAll('aside button')].find(b=>b.getAttribute('aria-label')==='Đóng Bảng')`,
    'Đóng Bảng',
  );
  await sleep(600);

  // ---- Hai dialog đích ----
  R.checks.savedDialog = await dialogTest(
    'saved',
    'Đã lưu',
    'Xoá toàn bộ kết quả đã lưu',
    'Xoá toàn bộ kết quả đã lưu?',
  );
  R.checks.historyDialog = await dialogTest(
    'history',
    'Lịch sử',
    'Xoá toàn bộ lịch sử',
    'Xoá toàn bộ lịch sử?',
  );

  // ---- Hồi quy B: Sheet «Hoàn cảnh» (trap đơn ở composer) ----
  const bs = await boardState();
  if (bs && bs.visible) {
    await mouseClick(
      `[...document.querySelectorAll('aside button')].find(b=>b.getAttribute('aria-label')==='Đóng Bảng')`,
      'Đóng Bảng (trước Hoàn cảnh)',
    );
    await sleep(600);
  }
  await mouseClick(FIND.btnStarts('Hoàn cảnh:'), 'mở Sheet Hoàn cảnh');
  await sleep(700);
  const ctxTabs = [];
  for (let i = 0; i < 6; i++) {
    await key('Tab', 'Tab', 9);
    ctxTabs.push(await focusInfo());
  }
  await key('Escape', 'Escape', 27);
  await sleep(700);
  const ctxAfter = await focusInfo();
  R.checks.contextSheet = {
    dialogLabelWhileOpen: 'Hoàn cảnh',
    tabOutsideCount: ctxTabs.filter((f) => !f.insideDialog).length,
    tabSeq: ctxTabs,
    afterEscape: ctxAfter,
    afterEscapeFocusIsTrigger:
      ctxAfter.tag === 'BUTTON' && (ctxAfter.text || '').startsWith('Hoàn cảnh:'),
    dialogClosedAfterEscape: (await dialogLabel()) === null,
  };
  log(
    'contextSheet',
    JSON.stringify({
      tabOutsideCount: R.checks.contextSheet.tabOutsideCount,
      escFocusIsTrigger: R.checks.contextSheet.afterEscapeFocusIsTrigger,
    }),
  );

  // ---- Tổng kết đếm được ----
  const s = R.checks.savedDialog;
  const h = R.checks.historyDialog;
  R.summary = {
    saved_tabOutside: s.tabOutsideCount,
    history_tabOutside: h.tabOutsideCount,
    saved_escapeClosedBoard: s.afterEscape.board ? !s.afterEscape.board.visible : null,
    history_escapeClosedBoard: h.afterEscape.board ? !h.afterEscape.board.visible : null,
    saved_escapeFocusIsTrigger: s.afterEscape.focusIsTrigger,
    history_escapeFocusIsTrigger: h.afterEscape.focusIsTrigger,
    saved_cancelFocusIsTrigger: s.afterCancel.focusIsTrigger,
    history_cancelFocusIsTrigger: h.afterCancel.focusIsTrigger,
    boardAlone_outsideAside: R.checks.boardAloneTrap.outsideAsideCount,
    contextSheet_tabOutside: R.checks.contextSheet.tabOutsideCount,
    contextSheet_escapeFocusIsTrigger: R.checks.contextSheet.afterEscapeFocusIsTrigger,
  };
  log('SUMMARY', JSON.stringify(R.summary, null, 2));
} catch (e) {
  R.error = String((e && e.stack) || e);
  log('ERROR', R.error);
} finally {
  fs.writeFileSync(`${OUT}/results-${PHASE}.json`, JSON.stringify(R, null, 2));
  try {
    chrome.kill();
  } catch {}
  process.exit(R.error ? 1 : 0);
}
