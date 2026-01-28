
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
  
  // Tangani file .tsx, .ts, atau impor tanpa ekstensi yang merujuk ke file lokal
  const isSource = url.pathname.endsWith('.tsx') || 
                   url.pathname.endsWith('.ts') || 
                   (!url.pathname.includes('.') && !url.pathname.startsWith('/@') && !url.pathname.includes('node_modules'));

  if (isLocal && isSource) {
    event.respondWith(
      (async () => {
        try {
          // Coba ambil file dengan ekstensi .tsx jika tidak ada titik di path
          let fetchUrl = event.request.url;
          if (!url.pathname.includes('.')) {
            fetchUrl += '.tsx';
          }

          const response = await fetch(fetchUrl);
          if (!response.ok) return response;
          
          const text = await response.text();
          
          // Abaikan jika ternyata isinya HTML (biasanya redirect 404)
          if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
             return response;
          }

          if (typeof Babel === 'undefined') {
            return new Response(text, { headers: { 'Content-Type': 'application/javascript' } });
          }

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
          console.error("Transpiler Error:", err);
          return new Response(`console.error("Engine Transpiler Error: ${err.message}");`, {
            headers: { 'Content-Type': 'application/javascript' }
          });
        }
      })()
    );
  }
});
