# Bản đồ bug ↔ test (CQ-07) + hàm ↔ test (CQ-05 iii)

Cập nhật: 2026-10-23 (fix wave 4 — đối chiếu 100%: mọi module logic đều có
test khoá trực tiếp; hai khoảng trống cuối của CQ-05 đã đóng). Mỗi bug đã đóng phải có test hồi quy
chạy trong `pnpm test` (hoặc suite bằng chứng trong `tests-evidence/`
ghi rõ cách chạy).

## Bug → test hồi quy

| Bug / phát hiện (nguồn)                                                                 | Test khoá                                                                                                   |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Panel #01 M-1: «Bố CON…» hiện kết quả khác «Bố con…» (không khoá chữ hoa ở bước nhập)     | `tests/casing-bank.test.mjs`                                                                                |
| Panel #01 M-2: vai ngoài nhóm bố mẹ chỉ có một câu fallback chung nông                     | `tests/generic-depth.test.mjs`                                                                              |
| Golden drift của engine client so với hành vi đã chốt                                     | `tests/golden-corpus-parents.test.mjs` (SERVER_GOLDEN giữ byte-for-byte từ backend gốc)                     |
| Tầng trung thực: nhãn nguồn, trạng thái «chưa đọc được», clipboard trung thực lùi          | `tests/honesty.test.mjs`                                                                                    |
| SEC-05 (hồ sơ vòng 3): field lạ `role:"admin"`/`isAdmin`, `angerLevel:99` bị nhận 200     | `tests/api-routes.test.mjs` — battery P6/P7 phải 400 `UNKNOWN_FIELD`/`VALIDATION_ERROR`                     |
| ARC-09: lỗi phẳng `{statusCode, message[]}` ngoài chuẩn; shape parse ở client phụ thuộc nó | `tests/api-routes.test.mjs` — mọi lỗi là `{ error: { code, message, fields? } }`, cap body 413               |
| CQ-14: client/server lệch chuẩn hoá, meaning, thang giận, examples 15↔14, validation      | `tests-evidence/engine-parity.test.mjs` (8/8) + khoá KI-PARITY-1/2/3, KI-VAL-1/2 trong `tests/known-issues.test.mjs` |
| ARC-10: dữ liệu localStorage cũ (JSON trần) có nguy cơ bị bản mới đọc sai/vứt              | `tests/storage.test.mjs` — fixture legacy đọc nguyên vẹn, migrate-on-read, schemaVersion lạ → null          |
| SEC-02: thiếu CSP                                                                          | `tests/csp.test.mjs` — directive bắt buộc có mặt trong `next.config.ts`                                     |
| KI-C1: rule kiểu bố mẹ lọt vào vai Người yêu (red-team test round 1)                       | **Chưa có test khoá** — điều kiện tiên quyết đã đủ (golden corpus + parity 8/8); thuộc sprint tối ưu 2, xem `tests/known-issues.test.mjs` |
| Panel #03 M-2 phần còn lại: ca 115 ký tự bao phủ chi tiết 1/2; dải 30–60 ký tự nuốt chi tiết 100% | `tests/generic-depth.test.mjs` — 5 test M-2/w4: bao phủ 2/2 + ≥2/3 replies khác stub + câu lý do mức; ca 43 ký tự; bộ 5 ca dải 30–60 (phản ánh 100%); cổng fallback một ý giữ byte (đối chiếu thêm differ độc lập: golden 0/53 + 0/36 mismatch) |
| Panel #03 D-4 (họ chữ ở mép container) + D-6 (bản ghi lệch phiếu)                          | Hình học là bằng chứng chính: harness đo render `../dichbome-qa/fix-wave-4/measure4.mjs` (trước/sau ở 320/390/1440) + panel vòng sau đo lại trên live; logic mức bản ghi (D-6) nằm trong `recordLevelLabel` dùng chung cho thẻ + lịch sử (board.tsx) |
| KI-PERF-1/2: ngân sách Tier A / preload font                                                 | Bằng chứng liên tục ở `tests-evidence/perf-budget.test.mjs`; Tier B đã khai ở `perf-budget.json` (ADR-002) — hai KI giữ dạng todo có chủ đích |

## Hàm/module logic → test bao phủ

| Module                                             | Test                                                                 |
| -------------------------------------------------- | -------------------------------------------------------------------- |
| `components/dichbome/lib/translate.ts` (engine client) | golden-corpus-parents, casing-bank, generic-depth, honesty, engine-parity (evidence) |
| `lib/server/engine.ts` (engine server)    | golden-corpus-parents (SERVER_GOLDEN), engine-parity (evidence)      |
| `lib/server/translate-handler.ts` + `api-errors.ts` | `tests/api-routes.test.mjs`                                         |
| `lib/api.ts` (client fetch + parse lỗi)            | `tests/api-client.test.mjs` — khoá TRỰC TIẾP (fetch giả lập): parse JSON/rỗng, error shape thống nhất + message rời + fallback statusText, Content-Type theo loại body, SEC-12 không Authorization; phía handler khoá thêm ở `tests/api-routes.test.mjs` |
| `components/dichbome/lib/storage.ts`               | `tests/storage.test.mjs`                                             |
| `components/dichbome/lib/honesty.ts`               | `tests/honesty.test.mjs`                                             |
| `components/dichbome/lib/clipboard.ts`             | `tests/honesty.test.mjs` (nhánh clipboard trung thực)                |
| `components/dichbome/lib/undo.ts`                  | `tests/undo.test.mjs` — unit test riêng cho `planDelete`: tách đúng, giữ thứ tự hai phía, không mutate đầu vào (module vẫn đóng băng — test chỉ import) |
| `next.config.ts` (CSP)                             | `tests/csp.test.mjs`                                                 |
