# Giải Mã Gia Đình (`dichbome`) — ghi chú cấu trúc repo

Repo này là bản độc lập hoàn chỉnh của sản phẩm: giao diện, API route và
engine đều nằm trong cùng một repo Next.js — không phụ thuộc host hay
mini app khác.

## Chế độ API

- `NEXT_PUBLIC_DICHBOME_API_MODE=http` (mặc định) — gọi
  `POST /api/products/dichbome/translate` và
  `GET /api/products/dichbome/examples` trên chính app này (engine phía
  server trong `lib/server/`).
- `NEXT_PUBLIC_DICHBOME_API_MODE=local` — không cần server: dùng engine
  rule-based trên máy trong `components/dichbome/lib/translate.ts`.

Chỉ import từ `./api` trong UI (`app.tsx`). Khi HTTP lỗi hoặc mất mạng,
UI tự rơi về engine local và báo rõ cho người dùng. Hai engine được một
parity suite tự động kiểm chứng khớp nhau ở các chiều đã đo (chuẩn hoá
text, nội dung đọc vị, thang mức giận, bộ câu mẫu, luật validation) —
xem README mục Development.

## Tính năng lưu trên thiết bị

- Nút **Lưu kết quả** giữ tối đa 20 mục trong `localStorage` khoá
  `dichbome_saved_v1`; lịch sử gần đây (tối đa 8 mục) dùng khoá
  `dichbome_history_v1`; tuỳ chọn người gửi/ngữ cảnh ở
  `dichbome_prefs_v1`. Mọi truy cập storage đi qua một adapter duy nhất
  (`components/dichbome/lib/storage.ts`) kèm `schemaVersion`.
- Khi mất mạng, app vẫn dịch bằng engine local (việc chuyển nguồn được
  ghi rõ trên kết quả); có mạng lại thì dùng API như thường.

## Contract

Xem README mục "API (built into this repo)" — contract đầy đủ kèm hình
dạng lỗi thống nhất `{ error: { code, message, fields? } }`.

## Auth

Không có đăng nhập và không có token nào trong app: engine thuần
rule-based, API route không yêu cầu Authorization. Mọi bản ghi đều ở
trên thiết bị của người dùng (xem README mục "Privacy & data").

## Nhận diện

Thương hiệu đỏ crimson `#C22A44` trên nền giấy ấm, font hiển thị
Fraunces + Be Vietnam Pro tự host — toàn bộ quy tắc ở `DESIGN.md` và
`PRODUCT.md`.
