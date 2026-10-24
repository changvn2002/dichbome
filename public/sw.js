/* Service worker viết tay — dichbome app shell (W5-01).
   Shell = cache-first; bản dịch qua /api/ = network-only (dữ liệu cá nhân,
   không bao giờ vào SW cache). Cập nhật không tự reload giữa phiên:
   skipWaiting chỉ chạy khi trang gửi message { type: 'SKIP_WAITING' }. */

// v3 (REDESIGN-V4): bộ asset brand thay toàn bộ (mark/hero/icons/OG) —
// bump cache cùng đợt đổi asset theo luật IDENTITY của hồ sơ.
const CACHE_NAME = 'dichbome-shell-v3';

const PRECACHE_URLS = [
  '/',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
  '/products/brand/dichbome-logo.svg',
  '/products/brand/dichbome-hero-stage.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

function isCacheFirstPath(pathname) {
  return (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/products/') ||
    pathname === '/og.png'
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Không bao giờ cache (và không can thiệp) request không phải GET — POST /api/ dịch
  // cũng đi qua đường này.
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // API: network only, không cache.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Điều hướng: network-first, lỗi mạng thì về shell đã cache.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/').then((cached) => cached || Response.error())),
    );
    return;
  }

  // Chỉ xử lý cùng origin; cross-origin để trình duyệt tự lo.
  if (url.origin !== self.location.origin) {
    return;
  }

  // Static assets: cache-first, miss thì tải mạng và put vào cache.
  if (isCacheFirstPath(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(request).then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      }),
    );
    return;
  }

  // GET cùng origin còn lại: stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
