# Giải Mã Gia Đình (`dichbome`) — Brand kit · REDESIGN-V4

> Nguồn sự thật của đợt V4: hồ sơ `~/workspace/mini-apps/redesign-v4/dichbome/`
> (IDENTITY.md · COLOR-SYSTEM.md · VISUAL-LAYER.md · TYPE-AND-ICON.md ·
> INTERFACE-SPEC.md) + `design/tokens.dichbome-v4.json` trong repo này.
> Mọi tài sản cũ của hệ ấm V2 (mascot mặt nháy, kem, đỏ cũ) đã CHẾT và bị
> cấm hồi sinh ở mọi sink — danh sách hex cấm nằm trong tokens.json
> (`bannedHex`) và được máy kiểm ở `pnpm tokens:verify`.

## Căn cước trong một câu

Một sân khấu **trắng–đen trung tính** nơi câu nói của bố mẹ là phần tử lớn
nhất; một điểm **đỏ TikTok nguyên giá trị `#FE2C55`** duy nhất đánh dấu
«đến lượt bạn đáp»; một câu «Ý thật» được đọc lại rõ ràng bằng giọng chữ
của app. Neo duy nhất: **TikTok** (seed loại A, Δbyte = 0 — không suy ra,
không làm trầm). Neutral là thang Grey của Google Material **vay có giấy
tờ** (loại N-vay) — cấm gọi neutral vay là «của TikTok».

## Mark «Lượt Đáp»

Một phiến thoại đặc bị khoét đúng một counter hình bậc thang: dải trên dài
(câu gốc), bậc xuống, dải dưới thụt vào (lời đáp). Hình học khoá 100% từ
V3 (lưới 96, module 8 — xem IDENTITY.md của hồ sơ); V4 chỉ đổi fill:

| Biến thể | File | Fill |
|---|---|---|
| Chính (≥24px) | `public/products/brand/dichbome-logo.svg` ← `assets/mark.svg` | `#FE2C55` |
| Micro (≤20px) | `dichbome-mark-micro.svg` | `#FE2C55` |
| Mono | `dichbome-logo-mono.svg` | `#000000` |
| Micro mono | `dichbome-mark-micro-mono.svg` | `#000000` |
| App icon | `dichbome-app-icon.svg` | Mark seed trên tile **đen** (0,8×) |
| Lockup | `dichbome-wordmark.svg` | Mark seed + wordmark **mực đen** (wordmark là chữ — cấm mang seed trên nền sáng) |

- Clearspace = 24đv mọi phía. Mark chính ≥24px; micro ≤20px (vùng 21–23px
  không tồn tại); micro không phóng >32px làm mark chính.
- Cấm: gradient mọi dạng trên mark, opacity, bóng, viền bao, xoay/lật/
  animate mark, thêm chi tiết vào counter, vẽ counter đối xứng, dùng
  mark chính thay micro ở ≤20px.
- Cấm vỏ TikTok: không nốt nhạc, không rail tim–bình luận–chia sẻ, không
  thanh điều hướng 5 mục kiểu TikTok, không cuộn vô hạn, không glitch
  lệch sắc trong UI thường trú (lệch sắc chỉ ở tầng asset/OG trên nền đen).

## Lớp hình

- Hero «Hai Lượt Một Nhịp» (`dichbome-hero-stage.svg`, 720×216) — phóng
  hình học của chính mark; chỉ ở sân khấu trống (in-flow) và Board trống
  dạng rút gọn «Phiến Chưa Ghim» (`dichbome-empty-board.svg`); trạng thái
  chưa-đọc-được dùng «Phiến Đứt Nét» ink-only (`dichbome-error-stage.svg`).
  Bề mặt làm việc art = 0 tuyệt đối.
- OG (`public/og.png`, sinh bởi `scripts/generate-brand-pngs.mjs`): nền
  đen, hero biến thể tối, tối đa 3 chấm cyan `#25F4EE` r=6 ở cạnh trên —
  nơi duy nhất cyan tồn tại. Cyan cấm trong UI ở mọi vai.
- Avatar `personas` cấm ở hero/empty/OG/sân khấu/phiếu (ĐK-D4).

## Raster

PNG icons + OG sinh từ SVG chính thức bằng `scripts/generate-brand-pngs.mjs`
(cần `@resvg/resvg-js` qua biến `RESVG_DIR`) — artwork chỉ được phóng/
ghép, không sửa. `app/favicon.ico` sinh từ icon-512 (mark trên tile đen).
