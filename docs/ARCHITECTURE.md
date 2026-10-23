# Kiến trúc — Giải Mã Gia Đình (dichbome)

Một trang sản phẩm duy nhất + hai API route tích hợp, không database,
không đăng nhập. Sơ đồ lớp:

```
UI (components/dichbome/)
  app.tsx ── stage 100dvh, điều phối trạng thái, lịch sử/lưu qua adapter
  composer.tsx · board.tsx · slip.tsx · find-out.tsx · privacy-sheet.tsx
  register-sw.tsx · web-vitals.tsx (RUM console-only)
        │  gọi qua hợp đồng DichbomeApi (api/types.ts)
API client
  api/index.ts ── chọn chế độ http | local theo env
  api/http.ts ── fetch route handler + chuẩn hoá thang giận 0-100 → 0-5
  api/local.ts ── gọi thẳng engine client trên máy
  lib/api.ts ── fetch wrapper cùng origin (không token, không auth)
        │
Engine (hai bản cài đặt — xem ADR-001)
  lib/server/engine.ts ── NGUỒN SỰ THẬT phía server
  components/dichbome/lib/translate.ts ── engine trên máy (offline)
  parity suite (tests-evidence/engine-parity.test.mjs) khoá độ khớp
        │
Server handlers (app/api/products/dichbome/)
  route.ts ── adapter mỏng (đọc body thô → handler thuần → Response)
  lib/server/translate-handler.ts ── validation + hình dạng lỗi thống nhất
  lib/server/api-errors.ts ── { error: { code, message, fields? } }
        │
Dữ liệu (chỉ trên máy người dùng)
  components/dichbome/lib/storage.ts ── adapter DUY NHẤT + schemaVersion
  localStorage: dichbome_history_v1 (≤8) · dichbome_saved_v1 (≤20)
                dichbome_prefs_v1 · dichbome_swipe_hint_v1
  Server không lưu gì: không DB, không log nội dung câu dịch.
```

Lớp trung thực (`components/dichbome/lib/honesty.ts`) đứng giữa engine
và trình bày: gắn nhãn nguồn (máy chủ / trên máy / ngoại tuyến), quyết
định trạng thái «chưa đọc được» và quy tắc clipboard — không sửa được
bởi tầng UI.

## Rendering theo route

| Route                                | Kiểu                                              |
| ------------------------------------ | ------------------------------------------------- |
| `/`                                  | Shell tĩnh (layout + metadata) bọc client app tương tác toàn phần |
| `/api/products/dichbome/translate`   | Route handler động (serverless), POST, không cache |
| `/api/products/dichbome/examples`    | Route handler, GET, trả bộ câu mẫu của engine server |
| `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`, `/opengraph-image` | Sinh bởi các file quy ước của Next (`app/robots.ts`, `app/sitemap.ts`, `app/manifest.ts`, `app/opengraph-image.tsx`) |
| `/sw.js`, `/icons/*`, `/.well-known/security.txt` | Tĩnh từ `public/`                        |

Dịch vụ ngoài duy nhất: Vercel (hosting + serverless) — kê khai đầy đủ
ở `docs/THIRD-PARTIES.md`.
