# ADR-001: Hai bản cài đặt engine, server là nguồn sự thật, parity suite là hợp đồng

Ngày: 2026-10-23 · Trạng thái: Accepted (fix wave 3)

## Bối cảnh

Sản phẩm có hai engine rule-based cùng nhiệm vụ "đọc vị" một tin nhắn:

- **Server** (`lib/server/engine.ts`) — hậu duệ của backend
  gốc trong monorepo studio; chạy ở API route khi có mạng.
- **Client** (`components/dichbome/lib/translate.ts`) — chạy ngay trên
  máy: chế độ `local` và đường rơi khi mất mạng/lỗi HTTP.

Hai bản từng lệch nhau có hệ thống (đo ở vòng chấm 3: chuẩn hoá text
khác thuật toán, nội dung đọc vị bản ngắn/bản dài, thang giận ánh xạ
khác nhau, bộ câu mẫu 15↔14, luật validation lệch một phía) — parity
suite chỉ đạt 2/8.

## Quyết định

1. **Server là nguồn sự thật duy nhất** cho mọi chiều đã đo: thuật toán
   chuẩn hoá, nội dung `meaning`, ánh xạ thang giận (0–100 → 0–5 làm
   tròn nửa-lên), bộ câu mẫu (15), luật validation (>500 ký tự, câu
   rỗng). Client sửa theo server; đầu ra golden của server giữ nguyên
   byte-for-byte.
2. **Parity suite là hợp đồng tự động**: `tests-evidence/engine-parity.test.mjs`
   phải đạt 8/8; mọi ca lệch từng sửa đều có khoá hồi quy trong
   `tests/known-issues.test.mjs` (KI-PARITY-1/2/3, KI-VAL-1/2).
3. **Phần chưa hợp nhất, ghi rõ thay vì giấu**: `realWant`, gợi ý trả
   lời và đường fallback cho các vai ngoài nhóm bố mẹ vẫn là phần riêng
   của từng bản cài đặt (fallback phía client cho vai bố mẹ đã mirror
   theo nhóm category của server ở fix wave 3). Tài liệu công khai chỉ
   tuyên bố khớp ở các chiều suite đo được.

## Hệ quả

- Người dùng nhận cùng một "đọc vị" cốt lõi dù có mạng hay không;
  nhãn nguồn trên kết quả vẫn phân biệt trung thực máy chủ/trên máy.
- Đổi luật đọc vị: sửa server trước, chạy parity suite, sửa client
  theo — thứ tự bắt buộc.
- Hướng dài hạn (chưa làm): sinh client engine từ cùng một nguồn dữ
  liệu luật để xoá hẳn chi phí đồng bộ thủ công; chỉ xét khi bộ luật
  thay đổi thường xuyên hơn nhịp hiện tại.
