# Changelog

Mọi thay đổi đáng kể của Giải Mã Gia Đình được ghi ở đây.
Định dạng theo [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
phiên bản theo [SemVer](https://semver.org/). Mỗi bản phát hành trên
production tương ứng một git tag `vX.Y.Z` — xem
`docs/RUNBOOK-ROLLBACK.md` cho bảng ghép đôi tag ↔ deployment.

## [Unreleased] — fix wave 3 (chờ deploy)

### Added

- CI đầy đủ (typecheck, lint, format, test, build, ngân sách bundle,
  gitleaks) + Dependabot hằng tuần.
- `SECURITY.md` + `/.well-known/security.txt` (RFC 9116).
- RUM Web Vitals tự host, chỉ ghi console trên máy người dùng.
- Tài liệu: `docs/ARCHITECTURE.md`, ADR-001/002,
  `docs/THIRD-PARTIES.md`, `docs/RUNBOOK-ROLLBACK.md`,
  `docs/QA-BUG-TEST-MAP.md`, hồ sơ ngoại lệ CSP (docs/security/).
- Dòng hướng dẫn trách nhiệm ngay tại ô nhập tin nhắn.

### Changed

- API lỗi theo một hình dạng thống nhất
  `{ error: { code, message, fields? } }`; field lạ bị từ chối 400,
  body quá lớn 413.
- Engine trên máy khớp engine server ở các chiều parity suite đo
  (chuẩn hoá, đọc vị, thang giận, 15 câu mẫu, validation) — suite 8/8.
- Chế độ chạy trên máy đổi tên nội bộ cho đúng bản chất (tên cũ gợi
  cảm giác bản giả lập); giá trị env mới: `NEXT_PUBLIC_DICHBOME_API_MODE=local`.
- Font: bỏ preload Be Vietnam Pro (chỉ Fraunces giữ preload);
  ngân sách JS khai Tier B ở `perf-budget.json`.
- Mọi truy cập localStorage qua một adapter có `schemaVersion`
  (dữ liệu cũ đọc được nguyên vẹn, nâng cấp khi ghi).
- LICENSE chỉ còn văn bản MIT thuần; loại trừ brand assets chuyển
  sang `NOTICE`.

### Removed

- Shim token đăng nhập cũ trong client API — app không có đăng nhập,
  không còn mã nào đọc/ghi token.

### Security

- Thêm Content-Security-Policy (hai directive `script-src`/
  `style-src` theo ngoại lệ path-C có hồ sơ + hạn xem xét lại
  2027-01-21 — xem `docs/security/`).

## [1.1.0] — 2026-10-23

### Added

- Thiết kế lại toàn bộ «Sân Khấu Hội Thoại»: khung 100dvh, composer
  ghim đáy, Board, lớp trung thực (nhãn nguồn, trạng thái
  «chưa đọc được», clipboard trung thực), xoá có xác nhận + hoàn tác
  8 giây, service worker tự viết, font Fraunces + Be Vietnam Pro.

### Fixed

- Toàn bộ lỗi Panel #02: khoảng đệm nút vuốt trên iOS, vùng trượt
  ngang, cỡ chữ gợi ý vuốt, đồng bộ nhãn app trong manifest/FAQ/JSON-LD.

## [1.0.0] — 2026-10-23

### Added

- Bản công khai đầu tiên: dịch tin nhắn người thân bằng engine
  rule-based tiếng Việt (API tích hợp + engine trên máy khi offline),
  lưu/lịch sử trên thiết bị, PWA, SEO.
