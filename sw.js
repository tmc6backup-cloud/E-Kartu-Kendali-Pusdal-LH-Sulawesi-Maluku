
/**
 * Engine Transpiler - PUSDAL LH SUMA
 * Versi: 2.1.0 (Stable)
 */

const BABEL_SOURCES = [
  'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.12/babel.min.js',
  'https://unpkg.com/@babel/standalone@7.23.12/babel.min.js',
  'https://cdn.jsdelivr.net/npm/@babel/standalone/babel.min.js'
];

let babelLoaded = false;

function loadBabel() {
  for (const src of BABEL_SOURCES) {
    if (babelLoaded) break;
    try {
      importScripts(src);
      babelLoaded = true;
      console.log('[Engine] Babel loaded: ' + src);
    } catch (e) {
      console.warn('[Engine] Failed source: ' + src);
    }
  }
}

loadBabel();

self.addEventListener('install', (e) => {
  console.log('[Engine] Memasang...');
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  console.log('[Engine] Mengaktifkan...');
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isTarget = url.pathname.endsWith('.tsx') || url.pathname.endsWith('.ts');

  if (url.origin === self.location.origin && isTarget) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(async (response) => {
          if (!response.ok) return response;

          const text = await response.text();
          
          // Deteksi apakah server mengirim HTML (404)
          if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
            console.error('[Engine] Menerima HTML untuk ' + url.pathname);
            return new Response(`console.error("Engine Error: File ${url.pathname} tidak ditemukan di server (404).");`, {
              headers: { 'Content-Type': 'application/javascript' }
            });
          }

          if (!babelLoaded || typeof Babel === 'undefined') {
            return new Response(`console.error("Engine Error: Compiler Babel belum siap.");`, {
              headers: { 'Content-Type': 'application/javascript' }
            });
          }

          try {
            const result = Babel.transform(text, {
              presets: [
                ['react', { runtime: 'automatic' }],
                ['typescript', { isTSX: true, allExtensions: true }],
                ['env', { modules: false, targets: { esmodules: true } }]
              ],
              filename: url.pathname,
              sourceMaps: 'inline'
            }).code;

            return new Response(result, {
              headers: { 
                'Content-Type': 'application/javascript',
                'Cache-Control': 'no-store, no-cache, must-revalidate'
              }
            });
          } catch (err) {
            console.error('[Engine] Kompilasi Gagal:', err);
            const cleanErr = err.message.replace(/"/g, "'");
            return new Response(`console.error("Syntax Error: ${cleanErr}");`, {
              headers: { 'Content-Type': 'application/javascript' }
            });
          }
        })
        .catch(err => {
          return new Response(`console.error("Fetch Error: ${err.message}");`, {
            headers: { 'Content-Type': 'application/javascript' }
          });
        })
    );
  }
});
