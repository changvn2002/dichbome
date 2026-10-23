# ADR-003: Lưu trữ phía client qua một adapter duy nhất có schemaVersion

Ngày: 2026-10-23 · Trạng thái: Accepted (quyết định thực thi ở fix wave 3,
tài liệu hoá ở fix wave 4 theo ARC-12)

## Bối cảnh

App giữ toàn bộ dữ liệu người dùng trên thiết bị (kết quả đã lưu, lịch sử)
trong localStorage — không có tài khoản, không có database phía server.
Qua các bản phát hành, định dạng payload có nguy cơ đổi (thêm trường,
đổi cấu trúc): nếu mỗi nơi tự đọc/ghi localStorage, một bản app mới có thể
đọc sai hoặc vứt dữ liệu của bản cũ — mất dữ liệu thật của người dùng mà
không có đường khôi phục.

## Quyết định

1. **Một adapter duy nhất**: mọi truy cập localStorage đi qua
   `components/dichbome/lib/storage.ts`. Không module nào khác được chạm
   trực tiếp vào localStorage cho dữ liệu của app.
2. **Phong bì có phiên bản**: payload ghi dưới dạng
   `{ schemaVersion, data }` với `STORAGE_SCHEMA_VERSION = 1` hiện tại.
3. **Migrate-on-read, không mất dữ liệu**: payload legacy (JSON trần,
   coi như version 0) vẫn đọc được nguyên vẹn; việc nâng cấp diễn ra khi
   đọc, không có bước migration phá huỷ riêng.
4. **Phiên bản lạ → từ chối an toàn**: phong bì có `schemaVersion` lớn
   hơn bản app hiểu được trả `null` (app coi như chưa có dữ liệu) thay vì
   đoán cấu trúc — dữ liệu của bản mới hơn không bị bản cũ ghi đè mù.

## Hệ quả

- Đổi schema trong tương lai = tăng `STORAGE_SCHEMA_VERSION` + viết
  nhánh migrate trong adapter + fixture test; không sửa các nơi dùng.
- Hợp đồng này được khoá bởi `tests/storage.test.mjs` (fixture legacy
  đọc nguyên vẹn, migrate-on-read, schemaVersion lạ → null).
- Rollback an toàn (xem `docs/RUNBOOK-ROLLBACK.md`): bản cũ đọc được dữ
  liệu bản mới ghi chừng nào schemaVersion chưa tăng.
