# Changelog

Mọi thay đổi đáng kể của Giải Mã Gia Đình được ghi ở đây.
Định dạng theo [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
phiên bản theo [SemVer](https://semver.org/). Mỗi bản phát hành trên
production tương ứng một git tag `vX.Y.Z` — xem
`docs/RUNBOOK-ROLLBACK.md` cho bảng ghép đôi tag ↔ deployment.

## [1.3.0] — 2026-10-24 — optimization sprint 2 (Panel #04: N-04-3 + N-04-4)

### Changed

- N-04-3 (độ sâu nội dung engine): câu trả lời gợi ý nay CHỐT bằng
  hành động cụ thể theo chi tiết đã trích (5 họ đuôi chốt × 3 thái
  độ, ở cả 2 engine) — ca chuẩn 115 ký tự: chốt 0/3 → 3/3, đuôi hẹn
  lảng «sẽ nói rõ thêm» 8/12 → 0/12, mẫu trần 4/12 → 0/12.
- Biến thể theo vai (`roleVariants`) cho 2 entry generic: vai ngoài
  gia đình (Đồng nghiệp / Sếp / Người yêu / Bạn thân) hết rò văn
  phong gia đình — rò server 7/9 → 0, client 1/9 → 0; hint ngữ cảnh
  phía client chỉ còn nối cho vai bố/mẹ.
- Corpus vàng 89 ca phụ huynh giữ byte-identical (differ 0/53 +
  0/36, angerLevel 0 dòng diff); parity client↔server 9/9.

### Fixed

- N-04-4: placeholder ô nhập ở khổ 390px bị nút «Dán» ăn 16,9px ở
  đuôi — nay gãy sạch, quét 48/48 ô (16 placeholder × 3 khung
  390/360/320) giao 0, khoảng cách tối thiểu ≥ 8px.
- KI-C1 (Người yêu + «Không sao đâu» dính marker gia đình): PASS
  thật, bỏ cờ todo thành khoá hồi quy. Suite 95 = 93 pass / 0 fail
  / 2 todo (còn KI-PERF-1/2 có chủ đích).

## [1.2.0] — 2026-10-24 — fix wave 4 (Panel #03 §10) + hotfix SEC-10

### Added

- ADR-003 (storage/schemaVersion) + ADR-004 (rendering strategy);
  `docs/dependency-report.md` (madge — 0 circular).
- Test cho `undo.ts` (5) và `lib/api.ts` (8) — CQ-05.

### Changed

- D-4: họ lỗi "chữ quyết định bề rộng layout" xử tới 0 ca ở ca điển
  hình (heading mồ côi, CTA composer, pill × nhãn gauge, suggestion
  bị clamp có nút mở tại chỗ).
- M-2: độ sâu bản dịch vai phụ — bao phủ chi tiết 2/2 ở ca 115 ký tự,
  corpus vàng 89 ca byte-identical, công thức angerLevel không đổi.
- Chữ đứng 77 → 71/75 (phép đếm COPY-DIET); ảnh empty-stage nhẹ hơn
  32% (PERF-09); RUNBOOK ghi region iad1 (OPS-02).

### Fixed

- D-6(2): thẻ đã lưu ở ca ít dữ kiện hết in «Mức n/5» sai — nay
  «Chưa đủ dữ kiện».

### Security

- next 16.3.6 → 16.4.2: vá 2 CRITICAL RCE (GHSA-2464-fhr4-w9xw,
  GHSA-673q-mjm6-r5xr) + HIGH SSRF/DoS; step audit CI hết
  continue-on-error, chặn thật (CQ-04).

## [1.1.0] — 2026-10-23 — fix wave 3

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
