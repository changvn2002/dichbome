# Kê khai bên thứ ba (DATA-08)

Cập nhật: 2026-10-23 (fix wave 3). Mọi bên thứ ba mà trang production
(`https://dichbome.vercel.app`) có thể chạm tới, đối chiếu với kiểm kê
code (CSP `connect-src 'self'` khoá egress ở tầng trình duyệt).

| Bên thứ ba                                    | Mục đích                                                                                    | Dữ liệu tới được tay họ                                                                                                              |
| --------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Vercel (hosting + serverless cho API route)   | Phục vụ trang, asset tĩnh, service worker và hai route `/api/products/dichbome/*`           | Nội dung câu người dùng gửi dịch đi qua hàm serverless khi ở chế độ `http`; nhà cung cấp hạ tầng xử lý request trong lúc thực thi và có log truy cập phía nền tảng (IP, thời gian, đường dẫn). App không lưu nội dung này ở bất kỳ đâu. |
| RUM Web Vitals (thư viện `web-vitals` tự host trong bundle) | Đo LCP/CLS/INP/FCP/TTFB của field thật                                                  | **Không rời máy.** Số đo chỉ ghi vào console của chính trình duyệt người dùng; không endpoint, không beacon, không bên thứ ba nào nhận được. |
| CDN / analytics / tracker / font bên ngoài    | —                                                                                           | **Không có.** Font tự host (next/font), không Google Analytics, không script bên thứ ba nào; CSP `default-src 'self'` + `connect-src 'self'` chặn egress lạ ở tầng trình duyệt. |

Ngoài các bên trên, trang không nạp tài nguyên từ bất kỳ domain nào khác.

Trạng thái đối chiếu mạng: kiểm kê theo code + CSP đã khóa (fix wave 3).
Bản chụp network trên production (DevTools capture) thuộc vòng QA trên
bản live sau deploy — parent thực hiện cùng re-grade vòng 4; file này
phải được cập nhật kèm đường dẫn capture khi có.
