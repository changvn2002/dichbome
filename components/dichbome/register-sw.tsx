'use client';

import { useEffect } from 'react';

/**
 * Đăng ký service worker (W5-01) — chỉ ở production.
 * Khi có bản SW mới đang chờ/đã cài (bản cập nhật, không phải lần cài đầu),
 * phát sự kiện 'dichbome:sw-update' để UI thông báo trong Board;
 * không bao giờ tự reload giữa phiên.
 */
export default function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      return;
    }
    if (!('serviceWorker' in navigator)) {
      return;
    }

    const notifyUpdate = () => {
      window.dispatchEvent(new CustomEvent('dichbome:sw-update'));
    };

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        if (registration.waiting && navigator.serviceWorker.controller) {
          notifyUpdate();
        }
        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) {
            return;
          }
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              notifyUpdate();
            }
          });
        });
      })
      .catch(() => {
        // Đăng ký SW thất bại: app vẫn chạy bình thường bằng mạng.
      });
  }, []);

  return null;
}
