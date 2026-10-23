# ADR-004: Chiến lược rendering — một route tĩnh, cây client tương tác, API route handler cho engine server

Ngày: 2026-10-23 · Trạng thái: Accepted (tài liệu hoá ở fix wave 4 theo
ARC-12; phản ánh kiến trúc đã chạy production từ bản standalone)

## Bối cảnh

Sản phẩm là một công cụ tương tác toàn phần (sân khấu dịch + Bảng) nhưng
vẫn phải đạt chuẩn SEO/PWA của một trang public: HTML ban đầu phải chứa
nội dung thật (giới thiệu, FAQ), và bản dịch "chuẩn" chạy ở phía server
khi có mạng, còn bản trên máy là đường rơi (xem ADR-001).

## Quyết định

1. **Một route duy nhất** (`app/page.tsx`, App Router): server component
   mỏng render cây `DichbomeApp`. Toàn bộ cây (kể cả Bảng và nội dung
   «Tìm hiểu»/FAQ) được render phía server vào HTML ban đầu rồi hydrate
   phía client — nội dung SEO nằm trong HTML tĩnh, tương tác chạy sau
   hydrate. Không có route nội dung riêng, không client-fetch cho nội
   dung tĩnh.
2. **Trang được prerender tĩnh**; trạng thái tương tác (phiếu dịch, dữ
   liệu đã lưu) sống hoàn toàn phía client (localStorage, ADR-003).
   Không có dữ liệu người dùng nào đi qua tầng render.
3. **Engine server chạy trong route handler**
   (`app/api/products/dichbome/translate`, runtime mặc định của Next) —
   không có backend riêng; handler thuần gọi `lib/server/engine.ts` và
   trả error shape thống nhất (ARC-09).
4. **PWA bằng service worker viết tay** (`public/sw.js`) với precache
   vỏ app; không dùng framework PWA — bề mặt đủ nhỏ để kiểm soát tay.

## Hệ quả

- Mọi thay đổi nội dung public đều phải giữ tính SSR-được: component
  trong cây không đọc `window`/`localStorage` ở lần render đầu (guard
  hoặc đọc lười sau mount) để HTML tĩnh không lệch bản hydrate.
- Thêm route mới (nếu sau này cần trang con) phải là quyết định có ý
  thức: cập nhật ADR này + sitemap + ngân sách hiệu năng (ADR-002).
