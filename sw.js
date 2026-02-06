
/**
 * Professional Engine Transpiler - PUSDAL LH SUMA
 * Version: 3.1.0 (Live-Update Optimized)
 */

const CACHE_NAME = 'pusdal-engine-v3.1';
const BABEL_SRC = 'https://cdn.jsdelivr.net/npm/@babel/standalone@7.24.7/babel.min.js';

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
  // Langsung aktifkan SW baru tanpa menunggu tab ditutup
  self.skipWaiting();
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

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isLocal = url.origin === self.location.origin;
  const path = url.pathname;
  
  const hasExt = path.split('/').pop().includes('.');
  const isTranspilable = isLocal && (path.endsWith('.ts') || path.endsWith('.tsx') || (!hasExt && !path.endsWith('/')));

  if (isTranspilable) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        
        try {
          // STRATEGI: Network-First
          // Coba ambil versi terbaru dari server dulu
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

            // Simpan hasil kompilasi terbaru ke cache
            cache.put(event.request, newResponse.clone());
            return newResponse;
          }
          
          throw new Error("Network response not ok");

        } catch (err) {
          // FALLBACK: Ambil dari Cache jika offline atau server gagal
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
