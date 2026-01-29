
/**
 * Optimized Engine Transpiler with Caching - PUSDAL LH SUMA
 * Versi: 2.6.0 (GitHub Pages Path & Extension Fix)
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
        console.log('[Engine] Babel Loaded successfully.');
      }
    } catch (e) {
        console.warn(`[Engine] Failed to load Babel from ${src}`, e);
    }
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
  
  // Ambil path bersih tanpa query params
  let cleanPath = url.pathname;
  
  // Cek apakah ini file sumber (TS/TSX) atau import modul lokal tanpa ekstensi
  // Kita anggap path lokal tanpa titik (.) sebagai kemungkinan file TS/TSX
  const isSource = cleanPath.endsWith('.tsx') || cleanPath.endsWith('.ts');
  const isPotentialModule = isLocal && !cleanPath.includes('.') && !cleanPath.endsWith('/');

  if (isLocal && (isSource || isPotentialModule)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(event.request);

        if (cachedResponse) return cachedResponse;

        try {
          if (!babelLoaded) loadBabel();
          
          let response = await fetch(event.request);
          
          // Jika 404 dan tidak ada ekstensi, coba cari dengan .ts atau .tsx
          if (!response.ok && isPotentialModule) {
            const trials = [cleanPath + '.ts', cleanPath + '.tsx'];
            for (const trial of trials) {
              const trialRes = await fetch(trial);
              if (trialRes.ok) {
                response = trialRes;
                cleanPath = trial; // Update path untuk Babel
                break;
              }
            }
          }

          if (!response.ok) return response;

          const content = await response.text();

          if (!babelLoaded || typeof Babel === 'undefined') {
            throw new Error("Transpiler (Babel) not ready.");
          }

          const result = Babel.transform(content, {
            presets: [
              ['react', { runtime: 'automatic' }],
              ['typescript', { isTSX: true, allExtensions: true }],
              ['env', { modules: false }]
            ],
            filename: cleanPath,
            sourceMaps: 'inline'
          }).code;

          const newResponse = new Response(result, {
            headers: { 'Content-Type': 'application/javascript' }
          });

          cache.put(event.request, newResponse.clone());
          return newResponse;
        } catch (err) {
          console.error(`[Engine] Transpilation failed for ${cleanPath}:`, err);
          return new Response(`console.error("Engine Fail [${cleanPath}]: ${err.message}");`, {
            headers: { 'Content-Type': 'application/javascript' }
          });
        }
      })()
    );
  }
});
