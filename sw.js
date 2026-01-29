
/**
 * Optimized Engine Transpiler with Caching - PUSDAL LH SUMA
 * Versi: 2.5.0 (GitHub Pages Compatibility Fix)
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
  
  // Strip query parameters for extension checking
  const cleanPath = url.pathname;
  const isSource = cleanPath.endsWith('.tsx') || cleanPath.endsWith('.ts');

  if (isLocal && isSource) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        // Use full URL as cache key to respect versioning if needed, 
        // but here we might want to ignore search for the cache match to be more efficient
        const cachedResponse = await cache.match(event.request);

        if (cachedResponse) {
          return cachedResponse;
        }

        try {
          if (!babelLoaded) loadBabel();
          
          const response = await fetch(event.request);
          if (!response.ok) {
              console.error(`[Engine] Server returned ${response.status} for ${cleanPath}`);
              return response;
          }
          const content = await response.text();

          if (!babelLoaded || typeof Babel === 'undefined') {
            throw new Error("Transpiler (Babel) not ready. Check internet connection.");
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

          // Save to cache
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
