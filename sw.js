
/**
 * Engine Transpiler - PUSDAL LH SUMA
 * Versi: 2.2.0 (Stable Multi-CDN)
 */

const BABEL_SOURCES = [
  'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.12/babel.min.js',
  'https://unpkg.com/@babel/standalone@7.23.12/babel.min.js',
  'https://cdn.jsdelivr.net/npm/@babel/standalone@7.23.12/babel.min.js'
];

let babelLoaded = false;

// Mencoba memuat Babel dari berbagai sumber CDN
function loadBabel() {
  for (const src of BABEL_SOURCES) {
    if (babelLoaded) break;
    try {
      importScripts(src);
      babelLoaded = true;
      console.log('[Engine] Babel Berhasil Dimuat: ' + src);
    } catch (e) {
      console.warn('[Engine] Gagal memuat Babel dari: ' + src);
    }
  }
}

loadBabel();

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isLocal = url.origin === self.location.origin;
  
  // Deteksi file .tsx, .ts, atau impor tanpa ekstensi
  const fileName = url.pathname.split('/').pop();
  const isSource = url.pathname.endsWith('.tsx') || 
                   url.pathname.endsWith('.ts') || 
                   (fileName && !fileName.includes('.') && !url.pathname.startsWith('/@'));

  if (isLocal && isSource) {
    event.respondWith(
      (async () => {
        try {
          let fetchUrl = event.request.url;
          // Tambahkan ekstensi .tsx jika tidak ada titik di nama file
          if (!fileName.includes('.')) {
            const search = url.search || '';
            fetchUrl = url.origin + url.pathname + '.tsx' + search;
          }

          const response = await fetch(fetchUrl);
          if (!response.ok) return response;
          
          const text = await response.text();
          
          // Pastikan bukan file HTML (seperti halaman 404)
          if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
             return response;
          }

          if (!babelLoaded || typeof Babel === 'undefined') {
            console.error('[Engine] Babel tidak tersedia. Pastikan koneksi internet stabil.');
            return new Response(`console.error("Engine Error: Babel gagal dimuat. Harap segarkan halaman.");`, {
              headers: { 'Content-Type': 'application/javascript' }
            });
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
            headers: { 
              'Content-Type': 'application/javascript',
              'Cache-Control': 'no-cache'
            }
          });
        } catch (err) {
          console.error("[Engine] Kompilasi Gagal:", err);
          return new Response(`console.error("Transpiler Error: ${err.message}");`, {
            headers: { 'Content-Type': 'application/javascript' }
          });
        }
      })()
    );
  }
});
