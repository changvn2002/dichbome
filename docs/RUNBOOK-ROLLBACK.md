# Runbook rollback (OPS-04)

Mục tiêu: đưa production về bản tốt gần nhất trong vài phút khi bản
deploy mới có sự cố. Dichbome không có database phía server và không
giữ dữ liệu người dùng — rollback không có rủi ro mất dữ liệu; dữ liệu
trên máy người dùng (localStorage) đọc được qua các bản nhờ adapter
`schemaVersion` (migrate-on-read).

## Sự kiện deploy (OPS-02)

- Nền tảng: Vercel, project `dichbome` (team changaffiliate1). Không có
  `vercel.json` ghim region trong repo — region chạy theo mặc định của
  Vercel.
- **Region của function** (route `/api/products/dichbome/translate`):
  **iad1** (US East, Washington D.C.) — bằng chứng: header
  `X-Vercel-Id: iad1::iad1::…` trên response POST thật tới production,
  đo 2026-10-23 (fix wave 4). Trang tĩnh/asset được phục vụ qua Edge
  Network toàn cầu (PoP gần người dùng nhất — cùng lần đo, request tĩnh
  được phục vụ từ `sfo1`), nên "region" cần ghi cho rollback/monitoring
  là region của function: iad1.
- Kiểm lại khi có thay đổi hạ tầng: gửi một POST tới API production và
  đọc lại `X-Vercel-Id` (cặp mã đầu là edge :: region function).

## Nguyên tắc ghép đôi tag ↔ deployment

- Mỗi lần deploy production, parent tạo **git tag** dạng `vX.Y.Z`
  trỏ đúng commit đã deploy, và ghi cặp (tag, Vercel deployment URL)
  vào bảng cuối file này.
- Không deploy commit chưa có trong `main`.

## Quy trình rollback

1. Xác định bản tốt gần nhất trong bảng ghép đôi bên dưới (hoặc trong
   Vercel dashboard → project `dichbome` → Deployments: bản
   Production gần nhất trước bản lỗi).
2. Trong Vercel dashboard: mở deployment đó → **⋯ → Promote to
   Production** (hoặc chạy `vercel promote <deployment-url>`).
   Đây là thao tác đổi alias — hoàn tất trong dưới một phút, không
   build lại.
3. Kiểm tra sau rollback:
   - `https://dichbome.vercel.app` tải được, `/sw.js` trả 200;
   - dịch thử một câu ở chế độ online (kết quả có nhãn nguồn máy chủ)
     và một câu khi tắt mạng (engine trên máy, nhãn trung thực);
   - service worker của bản mới sẽ tự thay ở lần tải kế tiếp — nếu bản
     lỗi nằm ở SW, mở DevTools → Application → Service Workers →
     Unregister một lần trên máy kiểm chứng để chắc chắn.
4. Ghi sự cố + bản đã rollback về vào bảng dưới và CHANGELOG.md; mở
   việc sửa ở nhánh riêng — không sửa nóng trên production.

## Rollback bằng git (khi cần build lại thay vì promote)

1. `git revert` các commit lỗi trên `main` (không force-push).
2. Deploy lại `main` qua luồng thường, tạo tag mới dạng `vX.Y.(Z+1)`
   ghi rõ "revert của …".

## Bảng ghép đôi tag ↔ deployment

| Tag     | Commit  | Vercel deployment | Ngày       | Ghi chú                        |
| ------- | ------- | ----------------- | ---------- | ------------------------------ |
| (chưa có tag — parent tạo ở lần deploy kế tiếp) | be4a721 | bản live redesign-v2 + fix wave Panel #02 | 2026-10-23 | Tag hồi tố do parent quyết định |

_Bảng này cập nhật ở MỖI lần deploy._
