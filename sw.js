// 快取的版本名稱 (當您更新了網站檔案時，請更改這個版號，例如改為 v2，以強制更新快取)
const CACHE_NAME = 'ai-language-app-cache-v1';

// 指定要預先快取的檔案清單
// ⚠️ 重要：因為架設在 GitHub Pages，所有路徑都必須包含子目錄前綴 '/ai-language-app/'
const urlsToCache = [
  '/ai-language-app/',
  '/ai-language-app/index.html',
  '/ai-language-app/manifest.json',
  '/ai-language-app/icon-192x192.png',
  '/ai-language-app/icon-512x512.png'
  // 💡 如果您有其他的 CSS, JS 或圖片檔，請依相同的格式加在下方，例如：
  // '/ai-language-app/style.css',
  // '/ai-language-app/app.js'
];

// ==========================================
// 1. 安裝階段 (Install)
// 將指定的靜態檔案載入並存入瀏覽器快取中
// ==========================================
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] 快取已開啟，正在存入檔案...');
        return cache.addAll(urlsToCache);
      })
  );
  // 強制立刻啟用新的 Service Worker
  self.skipWaiting();
});

// ==========================================
// 2. 啟用階段 (Activate)
// 當版本號 (CACHE_NAME) 改變時，清除舊版快取，釋放空間
// ==========================================
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] 清除舊版快取:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // 讓新的 Service Worker 立即接管所有開啟的網頁
  self.clients.claim();
});

// ==========================================
// 3. 攔截請求階段 (Fetch) - 離線支援核心
// 策略：快取優先 (Cache First)，若無快取則透過網路請求 (Network Fallback)
// ==========================================
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果在快取中找到相符的檔案，直接回傳快取檔案 (支援離線開啟)
        if (response) {
          return response;
        }

        // 如果快取中沒有，則向網路發送真實請求
        return fetch(event.request).then(
          function(networkResponse) {
            // 檢查是否為有效的成功回應
            if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // 將新抓取到的檔案也放入快取，方便下次離線使用
            var responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        );
      }).catch(() => {
        // 發生錯誤時 (例如處於完全離線且快取中也沒有該檔案)
        console.log('[Service Worker] 無法取得檔案且處於離線狀態。');
      })
  );
});
