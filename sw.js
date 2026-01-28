
/**
 * Engine Transpiler - PUSDAL LH SUMA
 */

const BABEL_URL = 'https://unpkg.com/@babel/standalone@7.23.12/babel.min.js';

try {
  importScripts(BABEL_URL);
} catch (e) {
  console.error("SW: Gagal memuat Babel");
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
          if (text.startsWith('<!DOCTYPE')) {
             throw new Error("File sumber tidak ditemukan (404)");
          }

          if (typeof Babel === 'undefined') {
            return new Response(text, { headers: { 'Content-Type': 'application/javascript' } });
          }

          try {
            const result = Babel.transform(text, {
              presets: [
                ['react', { runtime: 'automatic' }],
                ['typescript', { isTSX: true, allExtensions: true }],
                ['env', { modules: false }]
              ],
              filename: url.pathname,
              sourceMaps: 'inline'
            }).code;

            return new Response(result, {
              headers: { 'Content-Type': 'application/javascript' }
            });
          } catch (err) {
            return new Response(`console.error("Transpiler Error: ${err.message}");`, {
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
