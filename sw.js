
/**
 * Engine Transpiler - PUSDAL LH SUMA
 * Berfungsi mengubah kode TSX/TypeScript menjadi JavaScript di sisi client.
 */

// Daftar CDN Babel untuk redundansi
const BABEL_SOURCES = [
  'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.12/babel.min.js',
  'https://unpkg.com/@babel/standalone@7.23.12/babel.min.js',
  'https://cdn.jsdelivr.net/npm/@babel/standalone/babel.min.js'
];

let babelLoaded = false;

// Fungsi untuk memuat Babel dengan fallback
function loadBabel() {
  for (const src of BABEL_SOURCES) {
    if (babelLoaded) break;
    try {
      importScripts(src);
      babelLoaded = true;
      console.log('[Engine] Babel loaded from: ' + src);
    } catch (e) {
      console.warn('[Engine] Failed to load Babel from ' + src + ', trying next...');
    }
  }
}

loadBabel();

self.addEventListener('install', (event) => {
  // Langsung aktifkan tanpa menunggu tab ditutup
  self.skipWaiting();
  console.log('[Engine] Installing...');
});

self.addEventListener('activate', (event) => {
  // Ambil kendali atas semua tab yang terbuka segera
  event.waitUntil(clients.claim());
  console.log('[Engine] Activated and Claimed.');
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Hanya proses file lokal dengan ekstensi .tsx atau .ts
  if (url.origin === self.location.origin && (url.pathname.endsWith('.tsx') || url.pathname.endsWith('.ts'))) {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          if (!response.ok) return response;

          const text = await response.text();
          
          // Pastikan tidak memproses file HTML (misal 404 redirect)
          if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
            return response;
          }

          if (!babelLoaded || typeof Babel === 'undefined') {
            console.error('[Engine] Babel is not ready!');
            return new Response('console.error("Engine Error: Babel failed to load. Please check your internet connection.");', {
              headers: { 'Content-Type': 'application/javascript' }
            });
          }

          try {
            const transformed = Babel.transform(text, {
              presets: [
                ['react', { runtime: 'classic' }],
                ['typescript', { isTSX: true, allExtensions: true }],
                ['env', { modules: false }]
              ],
              filename: url.pathname,
              sourceMaps: 'inline'
            }).code;

            return new Response(transformed, {
              headers: { 
                'Content-Type': 'application/javascript',
                'Cache-Control': 'no-cache'
              }
            });
          } catch (err) {
            console.error('[Engine] Compilation Error:', err);
            return new Response(`console.error("Babel Error: ${err.message.replace(/"/g, "'")}");`, {
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
