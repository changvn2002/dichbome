# DESIGN.md — Giải Mã Gia Đình (dichbome) — REDESIGN-V4

> Nguồn sự thật: hồ sơ khoá `~/workspace/mini-apps/redesign-v4/dichbome/`
> (IDENTITY · COLOR-SYSTEM · VISUAL-LAYER · TYPE-AND-ICON · INTERFACE-SPEC).
> Token: `design/tokens.dichbome-v4.json` (bản sao hồ sơ, kiểm bằng
> `pnpm tokens:verify`); `app/tokens.css` là file SINH từ tokens.json —
> không sửa tay. `app/globals.css` chỉ ánh xạ token thành theme, không
> chứa hex. Code render phải khớp file này.

## Creative North Star — «The Conversation Stage» trên canvas trắng–đen

Một tin nhắn lên sân khấu trắng tuyệt đối: câu gốc là bong bóng mực đen
đứng một mình trong khung, bản giải mã là lời đáp bước ra đáp lại. Trang
là một khung `100dvh` không cuộn trang: app bar ghim trên, composer ghim
đáy, sân khấu cuộn nội bộ ở giữa. Mọi nội dung phụ sống trong **Board**
sau một lối vào duy nhất. Điểm đỏ TikTok nguyên giá trị chỉ xuất hiện ở
liều vi điểm (1,2–1,8% diện tích) để đánh dấu «đến lượt bạn đáp».

**Signature component:** Phiếu giải mã sân khấu (Stage Slip) — luôn đứng
dưới bong bóng câu gốc của chính nó, mở đầu bằng hàng meta ghi **nguồn
engine**, gồm Ý thật → Điều {vai} muốn nghe → Thước căng thẳng → 3 câu
trả lời có nút sao chép có chữ.

## Colors — 29 token (4 A · 10 N-vay · 14 B · 1 C)

Neo TikTok loại A, Δbyte = 0 (NEO-0). Neutral = thang Grey của Google
Material VAY có giấy tờ (N-vay) — không phải của TikTok. Toàn bộ bảng ở
tokens.json; các vai cứng:

| Vai | Token | Luật |
|---|---|---|
| Canvas | `neutral-canvas #FFFFFF` | Trắng tuyệt đối; cấm mọi nền nhuộm/kem |
| Bong bóng câu gốc | fill `neutral-900` + chữ trắng | Cấm bubble seed |
| CTA «Dịch» | fill `brand-seed #FE2C55` + nhãn **đen** `#000000` BVP 600/700 (5,71:1) | Cấm nhãn trắng trên seed (3,68:1 FAIL) |
| Chip/tab đã chọn | nền `neutral-200` + viền trái seed 2px + nhãn chữ | Cấm tint hồng làm nền chọn |
| Radio trong sheet (Hoàn cảnh) | nền chọn `neutral-100` | — |
| Focus | outline 2px seed, offset 2px; trên Grey 100 cộng vòng mực 1px (`.focus-on-bubble`) | Không tính vào ngân sách accent |
| Gauge | fill seed, track `neutral-300` | Typing dots = `neutral-800`, cấm brand-fill cho loop |
| Disabled | cặp `neutral-200` + `neutral-800` (8,66:1) | Cấm opacity giả bậc |
| Link/nhấn inline | mực `neutral-900` | Cấm chữ seed trên nền sáng |
| Semantic | bộ success/error/info/warning loại B trong tokens.json | Error tách hẳn khỏi seed; warning chữ = mực trên `warning-bg` |
| Avatar nền | Grey 50/100/200 + tint C `#FFE6EB` | Token C chỉ ở vai này; cấm seed làm nền avatar |

**Trần diện tích (đo trên render, COLOR-SYSTEM §6):** sân khấu có dữ liệu
neutral ≥95% · accent ≤2,0% · art 0% — sân khấu trống neutral ≥84% · art
≤12% — Board ≥96% — sheet ≥97% — toàn app neutral ≥94%.

**Hex cấm ở mọi sink (kể cả comment):** toàn bộ hệ ấm V2 + hệ V3 của
dichbome và `#1C2B33` — danh sách đầy đủ trong tokens.json `bannedHex`
+ nhóm cấm riêng của `scripts/verify-tokens.mjs`.

## Typography

| Vai | Khoá |
|---|---|
| Tuyên bố ≥24px (tiêu đề sân khấu trống) | **Fraunces `font-weight: 680` tường minh**, opsz tự động; thang 15 → 19 → 24 → 30 → 40 |
| Ý thật (trong phiếu) | **Be Vietnam Pro 400, 17/26** — Fraunces 560/400 cho Ý thật đã chết |
| Nội dung/UI | Be Vietnam Pro 400/500; 600/700 chỉ nhãn/nút (700 chỉ nhãn ≤2 từ) |
| Cấm | italic tổng hợp; chữ seed trên nền trắng; Fraunces <24px ở vai tuyên bố |

NFC bắt buộc cho tiếng Việt. Cổng F-6: render-chứng-minh glyph ở đúng
weight 680; trượt → fallback 700 đã định trước.

## Layout — «Folio hai lề» + luật mép chữ D-4

Measure thoại 640px = [lề chú 48px desktop / 24px mobile][measure 592px];
Board ≥1280px là cột phải 380px (gap 32), dưới đó là sheet toàn màn
hình. Bán kính: phiến/bong bóng 16 · nút 10 · chip vai full · mặt phiếu/
sân khấu 0. Bóng = 0 trên bề mặt tĩnh. 0 cuộn trang; 1 vùng cuộn sân
khấu + Board độc lập.

Luật D-4 giữ nguyên văn số V3 (giao = 0px² giữa phần tử dính/nổi và vùng
chữ; CTA composer 1 dòng ở 320px, cao ≤52px; heading neo dòng cuối ≥40%;
clamp phải mở được tại chỗ với vùng chạm ≥44×44).

**N-04-1 (đóng ở V4):** pill «Còn nội dung ở dưới» là **thanh trong luồng**
giữa viewport sân khấu và composer — không còn overlay tuyệt đối. Lý do:
overlay neo đáy chồng lên hàng số/nhãn thước ở các vai có composer cao
(giao 270–276 px² đo ở Panel #04); in-flow nằm ngoài vùng cuộn nên giao
= 0 px² theo cấu trúc ở mọi vai/viewport/chiều cao composer. Giữ nguyên
nhãn, 44px, hành vi cuộn 0,8×clientHeight, điều kiện hiện >24px.

## Visual layer

Hero «Hai Lượt Một Nhịp» (SVG tĩnh 720×216, in-flow, chỉ trạng thái
trống; lượt đầu đến ⇒ unmount). Board trống: «Phiến Chưa Ghim». Chưa đọc
được: «Phiến Đứt Nét» ink-only. Loading: không hình (typing dots là loop
duy nhất). Success: không hình ăn mừng. WebGL hero: **chết ở đợt V4**
(điều kiện người thật G-07 thuộc parent — VISUAL-LAYER §4: thiếu một
điều kiện là tự rớt xuống SVG tĩnh); bản chính là SVG tĩnh.

## Avatar — DiceBear 9.4.3

`personas` CHỈ ở hàng Đã lưu/Lịch sử trong Board khi mục có id ổn định,
với ràng buộc option theo quan hệ (ĐK-D5 — bảng theo vai trong
`components/dichbome/avatar.tsx`; vai không ràng buộc tin cậy được →
`initials`). Mọi bề mặt khác avatar = 0 hoặc initials. Công tắc module
duy nhất `AVATAR_PERSONAS_ENABLED` trong avatar.tsx: tắt = initials toàn
cục. Seed `dichbome:v1:contact:<id>`; palette chỉ Grey 50/100/200 +
`#FFE6EB`; render SVG inline client-side (CSP chặn data:-URI), chunk
lazy ngoài first-load, trần 15 KB gzip.

## Motion

D1–D8 của V3 giữ nguyên (trục X theo vai ±14px, `--ease-turn`/
`--ease-leave`, gauge 400ms, typing dots là loop duy nhất của app,
overshoot = 0, reduced-motion tôn trọng).
Token `--dur-stage3d: 640ms` chỉ dành cho WebGL thử việc — đã chết, xem
mục Visual layer.

## Trung thực engine (không đổi)

Nhãn nguồn gốc của bản dịch, trạng thái «chưa đọc được», clipboard
trung thực («đã sao chép» chỉ khi thật sự đã sao chép) thắng mọi quyết
định trình bày. Dòng riêng tư phải ở khung đầu sân khấu trống, không
được cắt ngắn để «gọn».
