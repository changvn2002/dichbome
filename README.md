<p align="center">
  <img src="public/products/brand/dichbome-wordmark.svg" alt="Giải Mã Gia Đình" width="420" />
</p>

# Giải Mã Gia Đình (dichbome)

**Dịch "ý thật" đằng sau tin nhắn của người thân** — dán một câu bố mẹ, con cái, mẹ chồng,
nàng dâu, vợ chồng hay sếp vừa nhắn, app cho bạn biết câu đó *thật ra nghĩa là gì*, người
nhắn *đang muốn gì*, mức độ căng thẳng tới đâu, và gợi ý sẵn **3 câu trả lời** cho êm chuyện.

Engine dịch là **rule-based tiếng Việt, deterministic** — không gọi AI bên ngoài, không cần
đăng nhập, không gửi dữ liệu đi đâu. Chạy hoàn toàn bằng một app Next.js duy nhất (UI + API
route handlers trong cùng repo).

> Ví dụ kinh điển: mẹ nhắn *"Tùy con, mẹ sao cũng được"* — nghe như cho tự quyết, nhưng ý
> thật thường là mẹ đã có sẵn đáp án trong đầu và đang chờ bạn hỏi thêm đúng một câu.

## Tính năng

- **Dịch đa quan hệ** — chọn vai người nhắn trong 4 nhóm: *Bố mẹ & con*, *Thông gia*
  (mẹ chồng ⇄ nàng dâu, mẹ vợ ⇄ con rể), *Vợ chồng & người yêu*, *Anh em, bạn bè & công việc*
  (sếp, đồng nghiệp). Đổi vai là đổi cách xưng hô và câu trả lời gợi ý.
- **Phân tích 3 lớp** cho mỗi tin nhắn: *Ý thật* → *Điều người nhắn muốn nghe* → *Đồng hồ đo
  mức giận* (0–5 trên UI) kèm nhãn cảnh báo và lưu ý khi câu nói dễ "ăn dỗi dài hạn".
- **3 câu trả lời mẫu** theo phong cách: *Ngoan nhất / Khéo nhất / An toàn nhất* — bấm là copy.
- **Hai chế độ chạy**:
  - `http` (mặc định): UI gọi API route handlers tích hợp sẵn trong repo này.
  - `mock`: UI dùng thẳng engine local trong trình duyệt — demo không cần server.
  - HTTP lỗi (mất mạng, server down) → UI **tự rơi về engine local** và báo rõ cho người dùng.
- **Lưu & chia sẻ trên thiết bị**: lưu tối đa 20 kết quả yêu thích + lịch sử gần đây trong
  `localStorage`, nút **Chia sẻ kết quả** dùng Web Share API (fallback: copy tóm tắt).
- **Offline-friendly**: mất mạng hiện banner offline, app vẫn dịch bằng engine local.
- **Thân thiện người lớn tuổi**: chữ to, nút chạm ≥ 44px, tông đỏ đậm `#C22A44` trên nền kem ấm.

## Tech stack

| Lớp | Công nghệ |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router) + React 19 + TypeScript (strict) |
| Styling | Tailwind CSS v4, font Be Vietnam Pro / Playfair Display (subset vietnamese) |
| Icons | lucide-react |
| Engine dịch | Rule-based tiếng Việt thuần TypeScript (`lib/server/engine.ts` + bản client `components/dichbome/lib/translate.ts`) |
| API | Next.js Route Handlers (`app/api/products/dichbome/*`) |
| Tooling | pnpm, ESLint (eslint-config-next), Prettier |

## Getting started

### Yêu cầu

- Node.js ≥ 20
- pnpm ≥ 9 (hoặc dùng `npx pnpm@10 ...` / `corepack`)

### Cài đặt & chạy

```bash
pnpm install
cp .env.example .env.local   # tuỳ chọn — giá trị mặc định đã chạy được ngay
pnpm dev                     # http://localhost:3000
```

### Scripts

| Lệnh | Việc |
| --- | --- |
| `pnpm dev` | Chạy dev server |
| `pnpm build` | Build production |
| `pnpm start` | Chạy bản production đã build |
| `pnpm typecheck` | Kiểm tra kiểu (`tsc --noEmit`) |
| `pnpm lint` | ESLint toàn repo |
| `pnpm format` / `pnpm format:check` | Prettier ghi / kiểm tra định dạng |

## Biến môi trường

| Biến | Mặc định | Mô tả |
| --- | --- | --- |
| `NEXT_PUBLIC_DICHBOME_API_MODE` | `http` | `http` = gọi route handlers của repo này; `mock` = chỉ dùng engine local trong trình duyệt. |
| `NEXT_PUBLIC_API_URL` | *(trống)* | Base URL khi chạy chế độ `http`. Trống = API cùng origin (khuyến nghị). Chỉ điền khi trỏ sang backend riêng tương thích contract bên dưới. |
| `NEXT_PUBLIC_SITE_URL` | `https://dichbome.vercel.app` | URL gốc của bản production, dùng làm `metadataBase` cho SEO (canonical, Open Graph, `sitemap.xml`, `robots.txt`). Không có slash cuối. |

Không có secret nào bắt buộc. Xem thêm `.env.example`.

## SEO & PWA

Bản standalone đã đóng gói sẵn SEO + PWA hoàn chỉnh, không cần cấu hình thêm:

- **Metadata đầy đủ** trong `app/layout.tsx` (đọc từ `lib/site.ts`): title/description
  tiếng Việt, `metadataBase` theo `NEXT_PUBLIC_SITE_URL`, canonical, robots,
  Open Graph + Twitter card dùng ảnh `public/og.png` (1200×630), `theme-color` đỏ brand `#C22A44`.
- **`app/robots.ts` + `app/sitemap.ts`** → `/robots.txt` và `/sitemap.xml`
  (chặn index thư mục `/api/`, sitemap trỏ về trang chủ).
- **JSON-LD** `WebApplication` (schema.org) nhúng trong layout — chỉ khai các trường
  có thật (tên, mô tả, `applicationCategory`, `inLanguage: vi`); không rating/giá/review.
- **PWA cài như app thật**: `app/manifest.ts` sinh `/manifest.webmanifest`
  (display `standalone`, nền kem `#FAF6EF`, theme `#C22A44`) kèm icon 192/512 +
  maskable 512; iOS dùng `apple-touch-icon` 180×180.
- **Icon/OG là PNG sinh từ SVG brand chính thức** bằng `scripts/generate-brand-pngs.mjs`
  (dùng `@resvg/resvg-js`, cách chạy ghi ở đầu file script). Artwork không hề bị sửa:
  script chỉ raster hoá nguyên bản logo cho icon, và với `og.png` thì thu nguyên tỉ lệ
  banner chính thức 1600×900 vào khung 1200×630 trên đúng màu nền banner tự vẽ
  (`#F6F1E7`) — không crop, không đổi màu. Icon maskable/iOS đặt nguyên bản logo vào
  giữa nền kem `#FAF6EF` vì hai nền tảng này không chấp nhận nền trong suốt.

## API contract

### `POST /api/products/dichbome/translate`

```jsonc
// Request
{
  "message": "Tùy con, mẹ sao cũng được",   // bắt buộc, 1–500 ký tự
  "speaker": "me",                          // tuỳ chọn — mã vai, xem dưới
  "context": "khac"                         // tuỳ chọn — mã hoàn cảnh, xem dưới
}

// Response 200
{
  "meaning": "…ý thật của câu nói…",
  "realWant": "…điều người nhắn muốn nghe…",
  "angerLevel": 62,                          // thang 0–100 ở tầng server
  "dangerLabel": "Giận ngầm — cần hạ nhiệt sớm",
  "replies": [
    { "label": "Ngoan nhất",   "text": "…" },
    { "label": "Khéo nhất",    "text": "…" },
    { "label": "An toàn nhất", "text": "…" }
  ],
  "warning": "…(tuỳ chọn)…"
}
```

- `speaker` codes: `me`, `bo`, `both` (legacy: `mom`, `dad`, `parents`), `child`,
  `mother-in-law`, `mother-of-wife`, `daughter-in-law`, `son-in-law`, `wife`, `husband`,
  `older-sibling`, `younger-sibling`, `lover`, `boss`, `coworker`, `friend`.
- `context` codes: `tien`, `ve-que`, `cong-viec`, `nguoi-yeu`, `cuoi`, `suc-khoe`,
  `o-chung`, `con-cai`, `khac`.
- Sai định dạng → `400` với body `{ statusCode, message: string[], error: "Bad Request" }`.
- Endpoint public, không cần auth.

### `GET /api/products/dichbome/examples`

Trả `{ examples: [{ message, speaker, context, tease }] }` — danh sách câu mẫu tĩnh để UI gợi ý.

> Client chuẩn hoá `angerLevel` 0–100 của server về thang 0–5 khi hiển thị
> (xem `components/dichbome/api/http.ts`).

## Project structure

```
.
├── app/
│   ├── layout.tsx                 # Fonts, metadata SEO đầy đủ + JSON-LD, <html lang="vi">
│   ├── page.tsx                   # Route "/" — gắn DichbomeApp
│   ├── globals.css                # Tailwind v4 + design tokens (subset của host gốc)
│   ├── robots.ts                  # → /robots.txt
│   ├── sitemap.ts                 # → /sitemap.xml
│   ├── manifest.ts                # → /manifest.webmanifest (PWA)
│   └── api/products/dichbome/
│       ├── translate/route.ts     # POST — validate + gọi engine
│       └── examples/route.ts      # GET  — câu mẫu tĩnh
├── components/dichbome/           # Toàn bộ mã sản phẩm (giữ nguyên cấu trúc bản gốc)
│   ├── app.tsx                    # UI chính (DichbomeApp, 'use client')
│   ├── api/                       # Client API: http / mock / types + chọn chế độ
│   └── lib/translate.ts           # Engine local cho chế độ mock + fallback khi offline
├── lib/
│   ├── api.ts                     # Fetch helper (shim tương đương @/lib/api của host)
│   ├── site.ts                    # Tên/mô tả/URL site dùng chung cho metadata, robots, sitemap, manifest
│   ├── utils.ts                   # cn()
│   └── server/engine.ts           # Engine phía server (port từ Nest module gốc)
├── scripts/
│   └── generate-brand-pngs.mjs    # Sinh og.png + icon PNG từ SVG brand (xem mục SEO & PWA)
├── public/
│   ├── og.png                     # Ảnh Open Graph 1200×630 (từ banner chính thức)
│   ├── icons/                     # Icon PWA 192/512, maskable 512, apple-touch-icon 180
│   └── products/brand/            # Logo/banner SVG chính thức (xem BRAND.md)
├── BRAND.md                       # Brand kit: màu, logo, quy tắc dùng
├── CONTENT.md                     # Kịch bản quay demo/content
├── EXTRACT.md                     # Tài liệu trích xuất gốc từ repo ChangtoTech
└── LICENSE                        # MIT
```

## Development

- **Thêm mẫu câu mới cho engine**: sửa từ điển `ENTRIES` trong `lib/server/engine.ts`
  (và bản client `components/dichbome/lib/translate.ts` nếu muốn chế độ mock khớp 100%).
  Thứ tự rule quan trọng: mẫu cụ thể đặt trước mẫu chung; rule gắn `speakers` được ưu tiên
  khi vai trùng.
- **Chuẩn code**: TypeScript `strict`, ESLint theo `eslint-config-next`, Prettier
  (single quote, semicolon, print width 100). Chạy `pnpm lint && pnpm typecheck` trước khi commit.
- **Không sửa `globals.css` để thêm màu riêng của app** — tông màu sản phẩm khai báo bằng
  CSS var cục bộ trong `components/dichbome/app.tsx` (xem EXTRACT.md).

## Deployment

App là Next.js thuần, deploy ở bất cứ đâu chạy Node (Vercel, Docker, VPS):

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

Trên **Vercel**: import repo, giữ nguyên mặc định (framework Next.js), không cần cấu hình
biến môi trường nào để chạy bản mặc định.

## Ghi chú bản trích xuất (porting notes)

Repo này được trích xuất từ mini app `dichbome` trong monorepo ChangtoTech Studio
(client tại `client/products/dichbome`, server tại `server/src/products/dichbome`).
Các khác biệt có chủ đích so với bản gốc trong monorepo:

1. **Backend NestJS → Next route handlers**: `DichbomeService` được port nguyên logic sang
   `lib/server/engine.ts` (chỉ bỏ decorator/DI của Nest); validation ở route handler mô
   phỏng đúng DTO gốc (message 1–500 ký tự, speaker/context theo danh sách mã cho phép,
   lỗi trả `400` dạng `{ statusCode, message[], error }`).
2. **Helper host `@/lib/api`**: thay bằng shim `lib/api.ts` giữ nguyên chữ ký và hành vi
   (gắn JWT từ `localStorage` nếu có, parse lỗi giống gốc), chỉ khác base URL mặc định là
   cùng origin thay vì `http://localhost:5101`. Các helper của host không liên quan tới app
   này (upload admin, media URL) không được mang sang.
3. **Nút "về danh sách ứng dụng"**: trong monorepo trỏ về `/apps` của host; ở bản standalone
   trỏ về `/` (chính app này) — 2 vị trí trong `components/dichbome/app.tsx`.
4. **File test không mang sang**: `lib/translate.spec.ts` (client) và
   `dichbome.service.spec.ts` (server) vẫn nằm ở repo gốc; engine ở đây giữ nguyên logic
   nên hành vi được bảo toàn, nhưng repo standalone hiện chưa có test suite riêng.
5. **Brand**: dùng bản SVG chính thức trong `public/products/brand/`; bản raster
   `dichbome-banner.webp` chỉ phục vụ đăng Facebook nên không nằm trong repo (xem BRAND.md).

## License

[MIT](LICENSE) © chang2tech
