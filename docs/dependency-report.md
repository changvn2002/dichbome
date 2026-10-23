# Báo cáo đồ thị phụ thuộc (ARC-11)

Ngày chạy: 2026-10-23 (fix wave 4) · Công cụ: `madge@8.0.0`

Lệnh chạy lại:

```bash
npx -y madge@8.0.0 --circular --extensions ts,tsx --ts-config tsconfig.json app components lib
```

Kết quả:

```
Processed 34 files (1.8s) (1 warning)
✔ No circular dependency found!
```

- **Vòng phụ thuộc: 0** trên toàn bộ 34 file nguồn (app/, components/,
  lib/) — tiêu chí circular của ARC-11 đạt.
- Đối chiếu file lớn: hai file >800 dòng còn lại là
  `components/dichbome/lib/translate.ts` (1,635 dòng sau fix wave 4) và
  `lib/server/engine.ts` (1,320 dòng sau fix wave 4) — cả hai là hai
  bản cài đặt engine dạng bảng luật (dictionary), giữ nguyên theo quyết
  định đã ghi ở ADR-001 (server là nguồn sự thật, parity là hợp đồng);
  việc tách nhỏ chúng không đổi hành vi nào và bị hoãn có chủ đích.
- Chạy lại báo cáo này mỗi khi thêm module mới ở tầng `lib/` hoặc đổi
  hướng phụ thuộc giữa `components/` và `lib/`.
