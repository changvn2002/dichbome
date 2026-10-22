# Giải Mã Gia Đình (`dichbome`) — Brand kit

> **Tên hiển thị mới (2026-10-09): Giải Mã Gia Đình.** Tên cũ "Dịch Tiếng Bố Mẹ" được mở rộng vì app nay dịch tin nhắn cho mọi quan hệ trong nhà — bố mẹ dịch con, mẹ chồng ⇄ nàng dâu, vợ chồng, anh em, sếp/bạn. **Slug/route giữ nguyên `dichbome`** (`/p/dichbome`) để không vỡ link, lịch sử local và API.
>
> **Hướng thiết kế đã chốt: "Mẫu E"** — tạp chí ấm áp: banner tranh lớn ở đầu trang, nền kem ấm rất nhạt (`#FAF6EF`), tiêu đề serif biên tập, thẻ trắng viền hairline `#E7DDD0`, nút chính đỏ đậm `#C22A44`, thanh điều hướng dưới kiểu PWA trên di động. Chốt này thay cho hướng phẳng trung tính trước đó nhưng vẫn giữ kỷ luật enterprise: không gradient pastel, không chip nhiều màu, không icon trang trí cute.

## Concept: "Bong bóng chat biết ý"

Mascot là một bong bóng chat đỏ đậm có hồn: một mắt mở, một mắt nháy — nó **nghe được điều bố mẹ nói và hiểu cả điều chưa nói**. Trái tim trắng ở giữa ngực chứa dấu ngoặc kép: tình thương nằm trong từng câu chữ. Kính lúp kem ở góc là dấu "soi ý" — nhìn qua một câu ngắn để thấy ý thật phía sau.

Ba lớp nghĩa trong một mark:

1. **Bong bóng chat** = tin nhắn của bố mẹ (điểm chạm hằng ngày).
2. **Mặt nháy mắt** = sự tinh ý, biết ý, không máy móc.
3. **Tim + ngoặc kép** = câu nói của bố mẹ luôn mang theo tình cảm.

## Bảng màu

| Vai trò | Màu | Hex | Ghi chú |
|---|---|---|---|
| Đỏ chính (mascot, điểm nhấn) | Đỏ đậm sâu | `#C22A44` | Màu duy nhất được "lên tiếng"; không pha gradient |
| Kem (chi tiết mặt, nền bìa) | Kem ấm | `#FBEEDB` / nền `#F6F1E7` | Chỉ đi cùng đỏ chính hoặc mực |
| Trái tim / bong bóng phụ | Trắng | `#FFFFFF` | Luôn đặt trên nền đỏ hoặc mực |
| Mực (chữ, bong bóng phụ, bản mono) | Đen mực | `#101418` | Dùng cho wordmark và bản đơn sắc |
| Xám nền app | Xám giấy host | `var(--paper)` / `#ECEEF1` | Thuộc hệ host Changto, không tự pha |

Quy tắc màu: **một màu nhấn duy nhất** (`#C22A44`). Không gradient, không thêm hồng/tím trang trí. Nếu cần màu thứ hai, dùng mực — không dùng màu mới.

## Tài sản (assets)

Tất cả nằm ở `client/public/products/brand/`:

| File | Loại | Dùng ở đâu |
|---|---|---|
| `dichbome-logo.svg` | SVG vector | Mark chính: header app, icon kệ apps/catalog, favicon, empty state |
| `dichbome-logo-mono.svg` | SVG vector 1 màu mực | Footer, ấn phẩm in, nền ảnh bận, chỗ chỉ in được 1 màu |
| `dichbome-wordmark.svg` | SVG vector | Lockup ngang mark + chữ: đầu banner, cover bài viết, ảnh chia sẻ |
| `dichbome-hero.svg` | SVG vector phẳng | Cover trên kệ apps (catalog `cover`) |
| `dichbome-banner.svg` | SVG vector ngang 1600×900 | Banner trong app (dưới header) — bản chính thức trên production |
| `dichbome-banner.webp` | Raster | Chỉ giữ cho đăng Facebook/content, KHÔNG còn là asset bắt buộc của app |

### Raster vs SVG khi đẩy GitHub

- **SVG là bản repo chính.** Sáu file SVG ở trên là text, connector GitHub đẩy tốt, sửa được từng nét. App chỉ dùng SVG (`dichbome-banner.svg` cho banner đầu trang) nên production không phụ thuộc file nhị phân nào.
- `dichbome-banner.webp` là raster chỉ giữ cho đăng Facebook/content; **bản gốc độ nét cao giữ ở** `~/workspace/repos/changtotech-stuido-shots/dichbome-brand/dichbome-banner-original.webp` (kèm bản generate mascot `dichbome-mascot-original.webp` làm nguồn vẽ lại vector). Không đẩy .webp qua connector (file nhị phân sẽ hỏng); cần bản raster thì lấy lại từ thư mục shots này — đừng generate lại, tránh lệch nhận diện.
- Mascot vector được vẽ lại tay từ bản generate: bỏ chấm/lấp lánh trang trí, nét dày đều để đọc tốt ở cỡ nhỏ. Khi cần mascot cho ấn phẩm lớn (poster, áo), ưu tiên dựng lại từ `dichbome-logo.svg`, không phóng to raster.

## Quy tắc dùng logo

- **Cỡ tối thiểu:** mark 24px trên màn hình, 8mm khi in. Dưới cỡ này mặt và tim sẽ dính nét — hãy dùng bản rút gọn (chỉ bong bóng + tim) khi thật cần, và báo lại để bổ sung file chính thức thay vì tự cắt.
- **Không gian trống:** chừa quanh mark ít nhất bằng chiều cao của trái tim, mọi phía.
- **Nền được dùng:** trắng, kem `#F6F1E7`, xám giấy host, đỏ `#C22A44` (chỉ với bản mono đảo trắng trong tương lai — hiện chưa có file, không tự đảo màu), ảnh ít chi tiết ở vùng đặt logo.
- **Không được:** đổi màu đỏ chính, thêm gradient/bóng đổ, xoay mark, kéo giãn, đặt chữ đè lên mark, tách trái tim ra dùng riêng như icon tim chung, vẽ lại mặt theo phong cách khác (mắt/miệng phải giữ nét kem dày, bo tròn).
- **Bản nào cho nền nào:** nền sáng → `dichbome-logo.svg`; in 1 màu/footer tối giản → `dichbome-logo-mono.svg`; cần cả tên → `dichbome-wordmark.svg` (không tự gõ chữ cạnh logo bằng font khác).

## Dùng cho content viral

- **Banner Facebook:** đăng `dichbome-banner.webp` nguyên khung kèm caption; khi cần chèn tên app lên ảnh, đặt `dichbome-wordmark.svg` ở góc dưới trái trên nền ảnh lặng (ghế sofa), không đè lên mặt người và bong bóng tim.
- **Sticker/avatar:** mascot là tài sản nhận diện chính — dùng `dichbome-logo.svg` làm avatar Page/kênh, ảnh đại diện comment, và sticker chèn ở góc video quay màn hình app (góc dưới phải, cỡ 64–96px, không che kết quả dịch).
- **Ảnh kết quả dịch:** khi chụp màn hình app để đăng, giữ nguyên header có logo mới; đó là cách nhận diện lan ra mà không cần đóng watermark.
- **Nhất quán:** mọi bài về app dùng đúng đỏ `#C22A44` cho chữ nhấn trên ảnh/caption art; không phối thêm màu pastel như các template AI.
