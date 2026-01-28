
/**
 * Optimized Engine Transpiler with Caching - PUSDAL LH SUMA
 * Versi: 2.4.0 (Performance Boost)
 */

const CACHE_NAME = 'engine-cache-v1';
const BABEL_SOURCES = [
  'https://cdn.jsdelivr.net/npm/@babel/standalone@7.24.7/babel.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.24.7/babel.min.js'
];

let babelLoaded = false;

function loadBabel() {
  for (const src of BABEL_SOURCES) {
    if (babelLoaded) break;
    try {
      importScripts(src);
      if (typeof Babel !== 'undefined') {
        babelLoaded = true;
        console.log('[Engine] Babel Optimized.');
      }
    } catch (e) {}
  }
}

loadBabel();

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k))))
    .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isLocal = url.origin === self.location.origin;
  const path = url.pathname;
  
  // Deteksi file sumber yang butuh transpilasi
  const isSource = path.endsWith('.tsx') || path.endsWith('.ts');

  if (isLocal && isSource) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(event.request);

        // Jika ada di cache, kirim langsung (Super Cepat)
        if (cachedResponse) {
          return cachedResponse;
        }

        try {
          if (!babelLoaded) loadBabel();
          
          const response = await fetch(event.request);
          if (!response.ok) return response;
          const content = await response.text();

          if (!babelLoaded || typeof Babel === 'undefined') {
            throw new Error("Transpiler not ready");
          }

          const result = Babel.transform(content, {
            presets: [
              ['react', { runtime: 'automatic' }],
              ['typescript', { isTSX: true, allExtensions: true }],
              ['env', { modules: false }]
            ],
            filename: path,
            sourceMaps: 'inline'
          }).code;

          const newResponse = new Response(result, {
            headers: { 'Content-Type': 'application/javascript' }
          });

          // Simpan hasil ke cache untuk penggunaan berikutnya
          cache.put(event.request, newResponse.clone());
          
          return newResponse;
        } catch (err) {
          return new Response(`console.error("Engine Fail: ${err.message}");`, {
            headers: { 'Content-Type': 'application/javascript' }
          });
        }
      })()
    );
  }
});
