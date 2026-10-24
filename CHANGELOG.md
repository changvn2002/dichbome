# Changelog

Mọi thay đổi đáng kể của Giải Mã Gia Đình được ghi ở đây.
Định dạng theo [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
phiên bản theo [SemVer](https://semver.org/). Mỗi bản phát hành trên
production tương ứng một git tag `vX.Y.Z` — xem
`docs/RUNBOOK-ROLLBACK.md` cho bảng ghép đôi tag ↔ deployment.

## [1.5.0] — 2026-10-24 — THIẾT KẾ LẠI hướng «Chat» (lệnh user 2026-10-24 ~20:29)

### Changed

- Toàn bộ lớp trình bày chuyển sang hướng **«Chat»** — hướng
  thắng cuộc bỏ phiếu mù mã hoá 5 ghế do parent điều phối lại
  sau khi hồ sơ panel mock cũ bị phát hiện lệch (bản tổng hợp
  thừa hưởng ghi sai kết quả; parent đọc trực tiếp biên bản thô:
  «Chat» 3/5 phiếu hạng nhất, «Editorial» 2/5, «Instrument» 0/5,
  diện mạo live cũ xếp chót ở cả 5 biên bản). Ngôn ngữ mới: cụm
  hai bong bóng «câu nói / Ý thật là…» ở màn hình trống, câu mẫu
  dạng bong bóng chat có avatar người gửi, phiếu giải mã treo
  trên sợi chỉ thread với thẻ «Ghi chú dịch», thang căng thẳng
  dạng viên chia đoạn, Bảng 400px với thread thật luôn hiện cạnh
  bên trên desktop.
- 13 lỗi thi công §4 của panel revote (ghế 2+3) đã xử lý: bỏ
  vòng tròn đỏ lơ lửng trên sợi chỉ, thống nhất một quy tắc
  avatar, nút «Dán» đọc như bấm được, dấu hiệu cuộn ở mép danh
  sách (fade), tách dòng xoá toàn bộ khỏi nhóm câu mẫu, dấu ×
  thuộc rõ từng mục, hàng số thang đo thẳng cột, bỏ nhãn người
  gửi trùng, nền chấm bi giảm mật độ sau cột Bảng…
- Panel pack 5 ghế chấm thuần bằng mắt: vòng 3, 4 FAIL toàn bộ,
  vòng 5 đạt 2/5, **vòng 6 PASS 5/5** (0 lỗi thị giác nghiêm
  trọng, hơn hẳn bản live rõ rệt ở cả 5 biên bản thô); parent tự
  xem pack cuối trước phát hành.
- Service worker shell: `dichbome-shell-v5`.

### Notes

- Engine + golden corpus nguyên vẹn: `git diff` trên `lib/` và
  `components/dichbome/lib/` = 0 dòng. Suite 96 pass / 0 fail /
  2 todo (known-issue cũ); bundle 188.817 B gzip ≤ trần 190.000.
  Accent giữ nguyên #FE2C55 byte-identical (tokens:verify PASS).
- Impeccable detect (chế độ source, 21 file): 1 finding
  «broken-image» ở find-out.tsx — parent phân xử FALSE POSITIVE
  (thẻ `<img>` dùng src SVG tự host thật, có alt + kích thước cố
  định, đã live từ v1.4.0); chế độ URL không chạy được trên VM
  này (không có binary Chrome cho detector) — ghi đầy đủ trong
  docs/reviews/v1.5.0-review-record.md.

## [1.4.1] — 2026-10-24 — đóng 7 MINOR của Panel #05

### Fixed

- Avatar personas nay sinh theo DANH TÍNH người gửi (vai + tên
  chuẩn hoá) thay vì id từng bản ghi: cùng một phiếu có cùng một
  gương mặt ở Đã lưu, Lịch sử và sau dịch lại. **Lưu ý: avatar của
  các bản ghi cũ đổi đúng một lần khi bản này lên sóng, sau đó ổn
  định vĩnh viễn theo danh tính.**
- Board tab mặc định hết đỏ quá liều: nút «Dùng câu này» về dạng
  trung tính — neutral 99,5% / accent 0,09% (từ 92,05% / 7,70%).
- Focus: đích focus lập trình không còn dính outline sau chạm;
  Escape/nút đóng sheet trả focus về đúng nút kích hoạt (16/16);
  hộp thoại xác nhận xoá nay giữ Tab khép kín bên trong và Escape
  chỉ đóng lớp trên cùng (lỗi có từ trước v1.4.0, đã tái lập trên
  HEAD sạch trước khi sửa).
- Engine: mệnh đề cam-chịu/cô-đơn («mẹ ở nhà một mình cũng quen
  rồi») nay được trích thành chi tiết riêng và có câu đáp trực
  tiếp — golden corpus giữ nguyên từng byte.
- Disclaimer offline trích đúng nhãn nút dịch thật theo vai.
- Hero: motif «nhịp đáp» 3 cột (bị kiểm mù đọc thành biểu đồ cột
  5/5) thay bằng echo hai bong bóng hội thoại (kiểm mù crop cô
  lập: 0/5 biểu đồ, toàn cảnh 5/5 «trò chuyện»); bản Tìm hiểu ở
  desktop dùng crop cận cảnh riêng. Logo/mark/wordmark không đổi
  một byte.

## [1.4.0] — 2026-10-24 — REDESIGN-V4 (TikTok seed, Neutral-First)

### Changed

- Toàn bộ giao diện theo hồ sơ REDESIGN-V4 đã khoá: canvas trắng
  tuyệt đối + thang Material Grey vay có giấy tờ, seed TikTok
  `#FE2C55` nguyên văn chỉ ở vai accent (CTA, bubble gốc, focus,
  gauge, chip chọn). Hệ màu ấm cũ (kể cả `#C22A44`) biến mất khỏi
  mọi sink; tokens:verify PASS 7/7 (bóc comment theo LK4-51).
- Chữ hiển thị Fraunces 680 + Be Vietnam Pro; mark «Lượt Đáp» giữ
  nguyên hình học; hero «Hai Lượt Một Nhịp» + 2 state-art mới
  («Phiến Chưa Ghim», «Phiến Đứt Nét»); OG/icons/favicon sinh lại
  (đen 96,02% · seed 1,27%).
- DiceBear 9.4.3: `personas` CHỈ ở hàng Đã lưu/Lịch sử có id ổn
  định, `initials` ở mọi nơi còn lại, render SVG inline (CSP giữ
  nguyên); công tắc `AVATAR_PERSONAS_ENABLED` để rút nhanh.
- WebGL KHÔNG ship: điều kiện sống G-07 (người thật) chưa chạy
  nên theo đúng văn bản hồ sơ, hero ở dạng SVG tĩnh.
- N-04-1 (điều kiện nghiệm thu Panel #04): pill đã chuyển từ
  overlay sang in-flow ngoài vùng cuộn — giao phần HIỂN THỊ đo
  0 px² ở 16/16 vai @390 và các ca lặp 320/1440 (2 verifier độc
  lập); phán quyết cuối thuộc Panel #05 với brief cơ chế kèm
  theo (xem review record v1.4.0).

### Fixed

- Record-MINOR M-3: token C nay có bộ ba OKLCH tính bằng script
  (ΔE2000 = 36,91) — không đổi byte màu nào.

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
