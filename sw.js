
/**
 * Engine Transpiler - PUSDAL LH SUMA
 */

const BABEL_CDN = 'https://unpkg.com/@babel/standalone@7.23.12/babel.min.js';

try {
  importScripts(BABEL_CDN);
} catch (e) {
  console.error("SW: Gagal memuat Babel CDN");
}

self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isLocal = url.origin === self.location.origin;
  const isSource = url.pathname.endsWith('.tsx') || url.pathname.endsWith('.ts');

  if (isLocal && isSource) {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          if (!response.ok) return response;
          
          const text = await response.text();
          // Cek jika yang diterima malah HTML (404 dari GitHub)
          if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
             throw new Error("File sumber tidak ditemukan (Menerima HTML)");
          }

          if (typeof Babel === 'undefined') {
            return new Response(text, { headers: { 'Content-Type': 'application/javascript' } });
          }

          const result = Babel.transform(text, {
            presets: ['react', 'typescript', 'env'],
            filename: url.pathname,
            sourceMaps: 'inline'
          }).code;

          return new Response(result, {
            headers: { 'Content-Type': 'application/javascript' }
          });
        })
        .catch(err => {
          const errorMsg = `console.error("Engine Error [${url.pathname}]: ${err.message}");`;
          return new Response(errorMsg, {
            headers: { 'Content-Type': 'application/javascript' }
          });
        })
    );
  }
});
