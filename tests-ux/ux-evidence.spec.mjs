/**
 * UX evidence tests — Worker W3, Sprint 1 dichbome (2026-10-23).
 * PHỤ TRỢ BẰNG CHỨNG — không phải test suite sản phẩm, không import vào app.
 * Chạy: node tests-ux/ux-evidence.spec.mjs
 * Kỳ vọng: các test C* (control) PASS; các test T* FAIL ở trạng thái hiện tại
 * = tái hiện vấn đề UX tương ứng trong báo cáo W3. Exit code 1 khi còn FAIL.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const app = read('components/dichbome/app.tsx');
const page = read('app/page.tsx');
const faq = read('lib/faq.ts');
const info = read('components/seo/InfoSections.tsx');

const results = [];
const check = (id, name, pass, detail) => results.push({ id, name, pass, detail });

/** Lấy thân một hàm/const theo điểm bắt đầu và độ dài cửa sổ. */
const sliceFrom = (src, marker, len = 1200) => {
  const i = src.indexOf(marker);
  return i < 0 ? '' : src.slice(i, i + len);
};

// ---------- CONTROL (phải PASS — chứng minh harness + các điểm tốt có thật) ----------
const exampleClick =
  sliceFrom(app, 'onClick={() => {\n                          setMessage(ex.message);', 500) ||
  sliceFrom(app, 'setMessage(ex.message);', 500);
check(
  'C1',
  'Câu mẫu bấm-1-lần: onClick của example gọi thẳng doTranslate',
  exampleClick.includes('doTranslate(ex.message, ex.speaker, ex.context)'),
  'examples onClick -> setMessage/setSpeaker/setContext + doTranslate(...) trong cùng handler',
);

const emptyGuard = sliceFrom(app, 'if (!text) {', 400);
check(
  'C2',
  'Submit rỗng: báo lỗi tiếng Việt + focus lại textarea + role=alert tồn tại',
  emptyGuard.includes('Hãy dán một câu') &&
    emptyGuard.includes('textareaRef.current?.focus()') &&
    app.includes('role="alert"'),
  'doTranslate guard: setError(`Hãy dán một câu ...`) rồi textareaRef.focus(); khối lỗi có role="alert"',
);

check(
  'C3',
  'Loading: nút bị disabled + chữ "Đang dịch…" + skeleton "Đang phân tích tin nhắn…"',
  app.includes('disabled={loading}') &&
    app.includes("'Đang dịch…'") &&
    app.includes('Đang phân tích tin nhắn…') &&
    app.includes('animate-pulse'),
  '3 dấu hiệu loading cùng tồn tại trong app.tsx',
);

check(
  'C4',
  'Share: có phản hồi chữ cho cả 3 kết cục (mở sheet / copy dự phòng / copy thất bại)',
  app.includes("showShareFeedback('Đã mở chia sẻ.')") &&
    app.includes("showShareFeedback('Đã copy để chia sẻ.')") &&
    app.includes("showShareFeedback('Không copy được. Hãy thử lại trên trình duyệt khác.')"),
  'shareResult có đủ 3 nhánh feedback, hiển thị 2400ms qua shareFeedback role=status',
);

// ---------- FAILING (tái hiện vấn đề) ----------
const copyFn = sliceFrom(app, 'const copyReply', 600);
const tryBlock = copyFn.slice(copyFn.indexOf('try {'), copyFn.indexOf('} catch'));
check(
  'T01a',
  'Copy: trạng thái "đã copy" CHỈ được set khi clipboard ghi thành công',
  tryBlock.includes('setCopiedIdx'),
  `setCopiedIdx nằm NGOÀI try (sau catch rỗng) = clipboard lỗi vẫn hiện dấu check. tryBlock chứa setCopiedIdx? ${tryBlock.includes('setCopiedIdx')}`,
);

const copyBtn = sliceFrom(app, 'onClick={() => void copyReply(reply.text, idx)}', 900);
check(
  'T01b',
  'Copy: nút copy có NHÃN CHỮ nhìn thấy được (không chỉ icon + tooltip/aria)',
  />\s*(Đã copy|Sao chép)\s*</.test(copyBtn),
  'trong JSX của nút không có text node ">Sao chép<"/">Đã copy<" nào — chữ chỉ nằm trong title/aria-label; người dùng chạm (không hover) chỉ thấy icon đổi Copy->Check trong 1600ms',
);

const navBlock = sliceFrom(app, 'aria-label="Điều hướng Giải Mã Gia Đình"', 2200);
const navItems = [
  ...navBlock.matchAll(/scrollToSection\('(\w+)'\)[\s\S]{0,400}?>(?:\s*<[^>]+>)*\s*([^\s<][^<]*)/g),
].map((m) => ({ target: m[1], label: m[2].trim() }));
const lichSu = navItems.find((i) => i.label === 'Lịch sử');
check(
  'T02',
  'Mobile bottom-nav: mục nhãn "Lịch sử" phải cuộn tới section lịch sử (#history)',
  lichSu?.target === 'history',
  `ánh xạ thật: ${JSON.stringify(navItems)} — nhãn "Lịch sử" đang trỏ #${lichSu?.target} (section "Đã lưu"), trong khi #history mới là "Đã dịch gần đây"`,
);

const terms = new Set();
if (app.includes('Mức độ không hài lòng'))
  terms.add('Mức độ không hài lòng (app.tsx — thẻ kết quả)');
if ((faq + info).includes('mức độ căng thẳng') || (faq + info).includes('Mức độ căng thẳng'))
  terms.add('Mức độ căng thẳng (lib/faq.ts + InfoSections — phần hướng dẫn/FAQ)');
check(
  'T03',
  'Một chỉ số giận = MỘT tên gọi nhất quán giữa thẻ kết quả và FAQ/hướng dẫn',
  terms.size === 1,
  `tìm thấy ${terms.size} tên: ${[...terms].join(' | ')} — user đọc FAQ tìm "mức độ căng thẳng" nhưng thẻ kết quả ghi tên khác`,
);

const restoreFn = sliceFrom(app, 'const restore = (item: HistoryItem)', 600);
check(
  'T04',
  'restore() từ Lịch sử/Đã lưu: phải cuộn/focus về vùng kết quả như doTranslate làm',
  /scrollIntoView|focus\(/.test(restoreFn),
  'restore() chỉ setState (message/speaker/result) — không scrollIntoView, không focus; doTranslate thì có cả hai (setTimeout 80ms)',
);

const clearSavedFn = sliceFrom(app, 'const clearSaved', 300);
const clearHistFn = sliceFrom(app, 'const clearHistory', 300);
check(
  'T05',
  'Xoá hết Đã lưu / Xoá lịch sử: phải có xác nhận hoặc hoàn tác (undo)',
  /confirm|undo|Hoàn tác|Bạn có chắc/.test(clearSavedFn + clearHistFn + app),
  'clearSaved/clearHistory gọi localStorage.removeItem ngay khi bấm, toàn app.tsx không có confirm/undo nào (grep = 0)',
);

check(
  'T07',
  'Đạt giới hạn 500 ký tự: phải có tín hiệu cho user biết đã chạm trần',
  /message\.length === MAX_CHARS|message\.length >= MAX_CHARS|đã đạt tối đa|tối đa 500/.test(app),
  'textarea có maxLength=500 + counter 0/500 nhưng không nhánh nào phản ứng khi length chạm MAX_CHARS — gõ tiếp im lặng, user không biết bị cắt',
);

check(
  'T08',
  'Nút back header: nhãn đích phải khớp đích thật (standalone "/" chính là app này)',
  !(app.includes('aria-label="Về danh sách ứng dụng"') && page.includes('<DichbomeApp />')),
  'header Link href="/" aria-label="Về danh sách ứng dụng", nhưng app/page.tsx mount DichbomeApp ngay tại "/" — không tồn tại màn danh sách nào để "về"',
);

// ---------- LIVE (cần mạng) ----------
try {
  const res = await fetch('https://dichbome.vercel.app/api/products/dichbome/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: '', speaker: 'mom' }),
  });
  const body = await res.json();
  const msgs = Array.isArray(body.message) ? body.message : [String(body.message)];
  const hasVietnamese = msgs.every((m) =>
    /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(m),
  );
  check(
    'T06',
    'API 400 (live): mọi message lỗi phải là tiếng Việt cho khớp UI + message JSON đã Việt hoá',
    res.status === 400 && hasVietnamese,
    `HTTP ${res.status}, messages=${JSON.stringify(msgs)} — thuần tiếng Anh, trong khi cùng route.ts có 'Body phải là JSON hợp lệ.'`,
  );
} catch (e) {
  check('T06', 'API 400 (live)', false, `không gọi được live API: ${e.message}`);
}

// ---------- REPORT ----------
let fails = 0;
for (const r of results) {
  if (!r.pass && r.id.startsWith('T')) fails++;
  console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.id}  ${r.name}\n      -> ${r.detail}`);
}
console.log(
  `\nTổng: ${results.length} test | control PASS: ${results.filter((r) => r.id.startsWith('C') && r.pass).length}/4 | vấn đề tái hiện (FAIL T*): ${fails}`,
);
process.exit(fails > 0 ? 1 : 0);
