
/**
 * Professional Engine Transpiler - PUSDAL LH SUMA
 * Version: 3.0.0 (Production Optimized)
 */

const CACHE_NAME = 'pusdal-engine-v3';
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

self.addEventListener('install', (e) => self.skipWaiting());
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
  
  const hasExt = path.split('/').pop().includes('.');
  const isTranspilable = isLocal && (path.endsWith('.ts') || path.endsWith('.tsx') || (!hasExt && !path.endsWith('/')));

  if (isTranspilable) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(event.request);
        if (cached) return cached;

        try {
          if (!babelLoaded) loadBabel();
          
          let response = await fetch(event.request);
          let finalPath = path;

          if (!response.ok && !hasExt) {
            const trials = [path + '.ts', path + '.tsx', path + '/index.ts', path + '/index.tsx'];
            for (const t of trials) {
              const res = await fetch(t);
              if (res.ok) { response = res; finalPath = t; break; }
            }
          }

          if (!response.ok) return response;

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
        } catch (err) {
          return new Response(`console.error("System Error [${path}]");`, {
            headers: { 'Content-Type': 'application/javascript' }
          });
        }
      })()
    );
  }
});
