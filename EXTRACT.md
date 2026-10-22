# Giải Mã Gia Đình (`dichbome`) — extract / demo / bán

Mọi code sản phẩm nằm trong folder này (client) và `server/src/products/dichbome` (server, do main tích hợp). Không phụ thuộc mini app khác — chỉ dùng nền tảng chung (`@/lib/api`, `@/lib/utils`, Tailwind của host).

## Chế độ API

- `NEXT_PUBLIC_DICHBOME_API_MODE=http` (mặc định) — gọi `POST /api/products/dichbome/translate` và `GET /api/products/dichbome/examples` trên host.
- `NEXT_PUBLIC_DICHBOME_API_MODE=mock` — demo UI không cần server: dùng engine rule-based local trong `lib/translate.ts`.

Chỉ import từ `./api` trong UI (`app.tsx`). Khi HTTP lỗi, UI tự rơi về engine local và báo rõ cho người dùng nên demo không bao giờ "chết".

## Tính năng lưu/chia sẻ trên thiết bị

- Kết quả có nút **Chia sẻ kết quả** (Web Share API nếu trình duyệt hỗ trợ, nếu không sẽ copy tóm tắt kèm URL trang hiện tại).
- Nút **Lưu kết quả** giữ tối đa 20 mục yêu thích trong `localStorage` khóa `dichbome_saved_v1`; lịch sử gần đây vẫn dùng `dichbome_history_v1`.
- Khi mất mạng, app hiện banner offline và vẫn dịch bằng engine local; banner tự ẩn khi có mạng lại.
- Luồng sau khi dịch hỗ trợ cuộn/focus tới kết quả trên di động và nút **Dịch câu khác** để dọn ô nhập nhanh.

## Contract

```
POST /api/products/dichbome/translate
Body: { message: string, speaker?: 'Mẹ' | 'Bố' | 'Cả hai', context?: 'Xin tiền' | 'Về quê' | 'Công việc' | 'Người yêu' | 'Cưới hỏi' | 'Sức khoẻ' | 'Khác' }
-> { meaning, realWant, angerLevel (0-5), dangerLabel, replies: [{ label, text }] x3, warning? }

GET /api/products/dichbome/examples
-> { examples: [{ message, speaker, context, tease }] }
```

Server nên tái dùng cùng bộ từ điển trong `lib/translate.ts` (port sang Nest util) để client mock và server trả kết quả giống nhau.

## Extract ra repo riêng

1. Copy nguyên folder `client/products/dichbome/` (kèm `api/`, `lib/`, `app.tsx`, file này).
2. Brand: copy `client/public/products/brand/dichbome-logo.svg` và `dichbome-hero.svg` sang `public/products/brand/` của repo đích.
3. Gắn `DichbomeApp` (named export từ `app.tsx`) vào route bất kỳ của Next shell đích (cần `'use client'`, Tailwind, `lucide-react`, và hai helper host `@/lib/api` + `@/lib/utils` — hoặc thay bằng shim tương đương).
4. Demo không server: đặt `NEXT_PUBLIC_DICHBOME_API_MODE=mock`.
5. Bản full: port contract trên sang Nest module `server/src/products/dichbome` (translate rule-based, examples tĩnh) rồi trỏ `NEXT_PUBLIC_API_URL` về API đó.

## Auth

Engine thuần rule-based, không cần đăng nhập để dịch. HTTP mode đi qua `api()` của host (tự gắn JWT Changtotech nếu có) — buyer thay base URL / header trong `api/http.ts` nếu auth khác.

## Nhận diện riêng

Tông hồng đào `#e2547a` / tím nho `#7c5cff` khai báo bằng CSS var cục bộ trong `app.tsx` (không sửa `globals.css`), thẻ bo 24px (`rounded-3xl`), chữ to dễ đọc cho người lớn tuổi, mọi nút chạm ≥44px.
