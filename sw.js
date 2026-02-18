
/**
 * Professional Engine Transpiler - PUSDAL LH SUMA
 * Version: 3.3.0 (PWA Optimized & Push Ready)
 */

const CACHE_NAME = 'pusdal-engine-v3.3';
const BABEL_SRC = 'https://cdn.jsdelivr.net/npm/@babel/standalone@7.24.7/babel.min.js';
const STATIC_ASSETS = [
  'https://upload.wikimedia.org/wikipedia/commons/4/4c/Logo_Kementerian_Lingkungan_Hidup_-_Badan_Pengendalian_Lingkungan_Hidup_%282024%29_%28cropped%29.png',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap'
];

let babelLoaded = false;

function loadBabel() {
  if (babelLoaded) return;
  try {
    importScripts(BABEL_SRC);
    if (typeof Babel !== 'undefined') babelLoaded = true;
  } catch (e) { console.error("Babel failed to load"); }
}

loadBabel();

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => {
        if (k !== CACHE_NAME) return caches.delete(k);
      })
    )).then(() => self.clients.claim())
  );
});

// Listener untuk Push Notification (Web Push API)
self.addEventListener('push', (event) => {
  let data = { title: 'E-Kendali Suma', body: 'Ada pembaruan status pada pengajuan Anda.' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Logo_Kementerian_Lingkungan_Hidup_-_Badan_Pengendalian_Lingkungan_Hidup_%282024%29_%28cropped%29.png',
    badge: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Logo_Kementerian_Lingkungan_Hidup_-_Badan_Pengendalian_Lingkungan_Hidup_%282024%29_%28cropped%29.png',
    vibrate: [200, 100, 200],
    data: { url: self.location.origin },
    actions: [
      { action: 'open', title: 'Buka Aplikasi' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isLocal = url.origin === self.location.origin;
  const path = url.pathname;
  
  const hasExt = path.split('/').pop().includes('.');
  const isTranspilable = isLocal && (path.endsWith('.ts') || path.endsWith('.tsx') || (!hasExt && !path.endsWith('/')));

  if (STATIC_ASSETS.includes(event.request.url)) {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
    return;
  }

  if (isTranspilable) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        
        try {
          if (!babelLoaded) loadBabel();
          
          let response = await fetch(event.request, { cache: 'no-store' });
          let finalPath = path;

          if (!response.ok && !hasExt) {
            const trials = [path + '.ts', path + '.tsx', path + '/index.ts', path + '/index.tsx'];
            for (const t of trials) {
              const res = await fetch(t, { cache: 'no-store' });
              if (res.ok) { response = res; finalPath = t; break; }
            }
          }

          if (response.ok) {
            const content = await response.text();
            const result = Babel.transform(content, {
              presets: [
                ['react', { runtime: 'automatic' }],
                ['typescript', { isTSX: true, allExtensions: true }],
                ['env', { modules: false }]
              ],
              filename: finalPath,
              sourceMaps: 'inline'
            }).code;

            const newResponse = new Response(result, {
              headers: { 'Content-Type': 'application/javascript' }
            });

            cache.put(event.request, newResponse.clone());
            return newResponse;
          }
          
          throw new Error("Network response not ok");

        } catch (err) {
          const cached = await cache.match(event.request);
          if (cached) return cached;

          return new Response(`console.error("System Error: File [${path}] tidak ditemukan dan tidak ada di cache.");`, {
            headers: { 'Content-Type': 'application/javascript' }
          });
        }
      })()
    );
  }
});
