
/**
 * Optimized Engine Transpiler with Caching - PUSDAL LH SUMA
 * Versi: 2.7.1 (Image Bypass Fix)
 */

const CACHE_NAME = 'engine-cache-v2';
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
  const path = url.pathname;
  
  // PERBAIKAN: Abaikan semua format gambar umum agar tidak diproses oleh Engine
  const isImage = path.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|bmp)$/i);
  if (isImage) return; 

  const hasExtension = path.split('/').pop().includes('.');
  const isPotentialSource = isLocal && !path.startsWith('/http') && (
    path.endsWith('.ts') || 
    path.endsWith('.tsx') || 
    (!hasExtension && !path.endsWith('/'))
  );

  if (isPotentialSource) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(event.request);

        if (cachedResponse) return cachedResponse;

        try {
          if (!babelLoaded) loadBabel();
          
          let response = await fetch(event.request);
          let finalPath = path;

          if (!response.ok && !hasExtension) {
            const trials = [path + '.ts', path + '.tsx', path + '/index.ts', path + '/index.tsx'];
            for (const trial of trials) {
              const trialRes = await fetch(trial);
              if (trialRes.ok) {
                response = trialRes;
                finalPath = trial;
                break;
              }
            }
          }

          if (!response.ok) return response;

          if (finalPath.endsWith('.ts') || finalPath.endsWith('.tsx') || finalPath.endsWith('.js') || !hasExtension) {
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
              filename: finalPath,
              sourceMaps: 'inline'
            }).code;

            const newResponse = new Response(result, {
              headers: { 'Content-Type': 'application/javascript' }
            });

            cache.put(event.request, newResponse.clone());
            return newResponse;
          }

          return response;
        } catch (err) {
          console.error(`[Engine] Fail for ${path}:`, err);
          return new Response(`console.error("Engine Error [${path}]: ${err.message}");`, {
            headers: { 'Content-Type': 'application/javascript' }
          });
        }
      })()
    );
  }
});
