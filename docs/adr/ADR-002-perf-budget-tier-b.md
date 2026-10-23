# ADR-002: Ngân sách hiệu năng Tier B + chính sách preload font

Ngày: 2026-10-23 · Trạng thái: Accepted (fix wave 3)

## Bối cảnh

Hồ sơ chấm vòng 3 mục PERF-08: first-load JS của dichbome đo 176.550 B
gzip — vượt Tier A (170.000 B) trong khi repo chưa từng khai tầng
ngân sách, và bộ font preload 10 file/160.220 B (8 file Be Vietnam Pro
+ 2 file Fraunces).

## Quyết định

1. **Khai Tier B** tại `perf-budget.json` (ngân sách 190.000 B gzip,
   hard cap 307.200 B của checklist, khoá tăng trưởng 10%/release),
   kiểm tự động bằng `scripts/check-bundle-budget.mjs` trong CI.
   Lý do tầng: đây là công cụ tương tác dùng được offline — first-load
   gồm stage + composer + engine chạy trên máy; Tier A dành cho trang
   nội dung/marketing.
2. **Preload font**: chỉ Fraunces (font hiển thị — chữ ký thương hiệu
   ở sân khấu, phần tử gần LCP) giữ preload. Be Vietnam Pro đặt
   `preload: false`: 4 weight × 2 subset = 8 file (~73 KB) không còn
   tranh băng thông first paint; font vẫn nạp qua CSS cùng origin với
   `display: swap`. Cả 4 weight đều đang được UI dùng thật (đo bằng
   grep lớp font-weight) nên không cắt weight nào.
3. **PERF-12**: RUM tự host bằng thư viện `web-vitals` nạp lười, chỉ
   ghi console trên máy người dùng — không endpoint, không beacon
   (xem `docs/THIRD-PARTIES.md`).

## Hệ quả / số đo

- Preload: 10 file/160.220 B → 2 file/87.136 B (số đo lại sau build ở
  báo cáo fix wave 3). Ngân sách font tham chiếu của bộ bằng chứng
  (≤60 KB preload) vẫn chưa đạt vì riêng subset latin của Fraunces đã
  67 KB — giữ nguyên quyết định này vì cắt preload của font hiển thị
  làm chớp font ở tiêu đề chính; ghi nhận mở ở
  `tests/known-issues.test.mjs` (KI-PERF-2).
- Tổng payload font không đổi (15 file) — các subset latin-ext vẫn cần
  cho ký tự mở rộng; chấp nhận và ghi rõ thay vì cắt tính năng chữ.
