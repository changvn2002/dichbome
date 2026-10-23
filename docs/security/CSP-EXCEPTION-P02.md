# Hồ sơ ngoại lệ P-02 — CSP cho trang tĩnh Next.js (SEC-02)

Ngày: 2026-10-23 · Mục checklist: SEC-02 (CSP phải có, hướng chuẩn là
không `unsafe-inline`) · Ngoại lệ liên quan: EXC-CSP-01 (script-src),
EXC-CSP-02 (style-src) trong `EXCEPTION-REGISTRY.md` — hết hạn
**2027-01-21** hoặc release kế tiếp, mốc nào sớm hơn.

## Đường đã chọn: C (CSP thật + ngoại lệ có đăng ký)

`next.config.ts` gắn CSP cho mọi route. Mọi directive đều chặt
(`default-src 'self'`, `object-src 'none'`, `base-uri 'self'`,
`frame-ancestors 'none'`, `connect-src 'self'`, `img-src 'self'`,
`font-src 'self'`, `worker-src 'self'`, `manifest-src
'self'`, `form-action 'self'`, không `unsafe-eval`). Chỉ hai directive
mang `'unsafe-inline'`: `script-src` và `style-src` — lý do và bằng
chứng dưới đây. Nội dung có hại của hai ngoại lệ bị chặn lại bởi các
directive còn lại: không eval, không object, không base-uri lạ,
không framing, egress mạng khoá ở `connect-src 'self'`.

## Vì sao đường A (hash tĩnh) không khả thi — thí nghiệm 2 build

Next.js App Router chèn hai inline script vào HTML đã prerender: một
bootstrap ngắn và một khối flight data (RSC payload). Nếu hash của
chúng đổi theo từng build, một allowlist hash tĩnh trong config không
bao giờ khớp bản deploy kế tiếp. Đã đo trực tiếp trên repo này, hai
lần `pnpm build` liên tiếp cùng một cây mã nguồn (fix wave 3,
2026-10-23):

| Build | BUILD_ID              | inline[0] (bootstrap, 43 B) sha256 | inline[1] (flight data, 12.582 B) sha256 |
| ----- | --------------------- | ---------------------------------- | ---------------------------------------- |
| 1     | `_HxXff9eMFO_JKa7SHZbs` | `3814cddd18b2095e01abb745a99e5ada90178e709c09879324c3b623f2d829ea` | `5f333edd40b2c2c4…` (tiền tố 16 hex: `5f333edd40b2c2c4`) |
| 2     | `uT9XX3gSQmUKR0seC7-cY` | `3814cddd18b2095e01abb745a99e5ada90178e709c09879324c3b623f2d829ea` | `e32000f77191dcc08b67ce3ccd37e43fdae0b8ab7a4de8091756f6836e144c23` |

Kết quả: hash bootstrap ổn định tuyệt đối, nhưng hash flight data
**đổi ở mỗi build** (payload nhúng build id). Đường A gãy ở đúng điểm
này — trùng khớp kết luận độc lập của chiatien (cùng thí nghiệm, cùng
kết quả).

## Vì sao đường B (nonce) không chọn

Nonce yêu cầu render động theo từng request (middleware gắn nonce +
trang không còn prerender tĩnh). Đánh đổi: mất bản HTML tĩnh hiện tại
(SEO shell + first paint + service worker precache đang dựa vào nó) để
đổi lấy việc bỏ một token trong CSP — trong khi bề mặt tấn công thực
tế đã bị các directive chặt còn lại giới hạn. Ghi nhận là đường nâng
cấp khi framework hỗ trợ nonce cho trang tĩnh.

## Verdict style-src (EXC-CSP-02)

React gắn thuộc tính `style` nội tuyến cho biến CSS theo instance
(ví dụ `--i` cho stagger) và framework chèn `<style>` khi prerender;
stylesheet ngoài vẫn chỉ `'self'` (`style-src 'self' 'unsafe-inline'`
không mở đường cho CSS từ origin lạ). Cùng hạn và cùng quy trình gia
hạn với EXC-CSP-01.

## Điều kiện đóng ngoại lệ

Khi Next/Vercel hỗ trợ hash ổn định hoặc nonce cho route tĩnh mà
không đổi loại render: bỏ hai token `'unsafe-inline'`, đóng hai dòng
EXC trong sổ đăng ký, cập nhật hồ sơ này thành "đã đóng" kèm bằng
chứng build. `tests/csp.test.mjs` khoá cả hai phía: directive bắt
buộc phải có mặt, token chỉ được xuất hiện đúng ở hai directive đã
đăng ký, và test tự fail khi quá ngày hết hạn trong sổ.
