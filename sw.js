const CACHE_NAME = 'truyen-audio-v4';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json'
];

// Cài đặt và kích hoạt ngay lập tức không cần chờ
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Tự động xóa sạch các bản cache cũ (v1, v2, v3...) và chiếm quyền điều khiển ngay
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Chiến lược Network-First: Luôn lấy bản mới từ mạng, cập nhật vào cache; nếu mất mạng mới dùng bản cũ
self.addEventListener('fetch', (e) => {
  // Bỏ qua các request không phải GET hoặc từ domain ngoài (như YouTube)
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseClone);
        });
        return networkResponse;
      })
      .catch(() => caches.match(e.request))
  );
});