'use client';

import { useEffect } from 'react';

/**
 * RUM tối thiểu, TỰ HOST 100% (PERF-12, fix wave 3 — theo mẫu
 * components/chiatien/web-vitals.tsx): đo Core Web Vitals bằng thư viện
 * web-vitals (nạp lười bằng dynamic import — không nằm trên critical
 * path, xem perf-budget.json) và ghi kết quả vào CONSOLE của chính trình
 * duyệt người dùng. Không gửi đi đâu: không endpoint, không beacon,
 * không bên thứ ba — số đo ở lại trên máy (kê khai ở
 * docs/THIRD-PARTIES.md). Mục đích: có số field thật để chốt cụm PERF
 * đang UNKNOWN vì thiếu field data (hồ sơ chấm vòng 3) khi đội QA mở
 * DevTools trên thiết bị thật.
 */
export function WebVitalsReporter() {
  useEffect(() => {
    let cancelled = false;
    import('web-vitals')
      .then(({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
        if (cancelled) return;
        const report = (metric: { name: string; value: number; rating: string }) => {
          console.info(
            `[web-vitals] ${metric.name} = ${Math.round(metric.value * 100) / 100} (${metric.rating})`,
          );
        };
        onCLS(report);
        onFCP(report);
        onINP(report);
        onLCP(report);
        onTTFB(report);
      })
      .catch(() => {
        // Không nạp được thư viện đo (trình duyệt rất cũ) — app không bị
        // ảnh hưởng; RUM là lớp quan sát, không phải điều kiện chạy.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
