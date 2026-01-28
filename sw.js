
/**
 * Engine Transpiler - PUSDAL LH SUMA
 * Versi: 2.3.0 (Ultra-Stable Fallback)
 */

const BABEL_SOURCES = [
  'https://cdn.jsdelivr.net/npm/@babel/standalone@7.24.7/babel.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.24.7/babel.min.js',
  'https://unpkg.com/@babel/standalone@7.24.7/babel.min.js',
  'https://esm.sh/@babel/standalone@7.24.7'
];

let babelLoaded = false;

function loadBabel() {
  for (const src of BABEL_SOURCES) {
    if (babelLoaded) break;
    try {
      // importScripts adalah sinkron di dalam SW
      importScripts(src);
      if (typeof Babel !== 'undefined') {
        babelLoaded = true;
        console.log('[Engine] Babel Berhasil Dimuat dari: ' + src);
      }
    } catch (e) {
      console.warn('[Engine] Gagal memuat dari ' + src + '. Mencoba sumber lain...');
    }
  }
}

// Inisialisasi awal
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
  
  // Deteksi file sumber (.tsx, .ts)
  const path = url.pathname;
  const fileName = path.split('/').pop() || '';
  const isSource = path.endsWith('.tsx') || 
                   path.endsWith('.ts') || 
                   (fileName && !fileName.includes('.') && !path.includes('/@') && !path.includes('node_modules'));

  if (isLocal && isSource) {
    event.respondWith(
      (async () => {
        try {
          // Pastikan Babel tersedia, jika belum coba muat ulang (lazy load)
          if (!babelLoaded) loadBabel();

          let fetchUrl = event.request.url;
          if (!fileName.includes('.')) {
            const search = url.search || '';
            fetchUrl = url.origin + path + '.tsx' + search;
          }

          const response = await fetch(fetchUrl);
          if (!response.ok) return response;
          
          const text = await response.text();
          
          // Lewati jika ini bukan kode (misal halaman 404 HTML)
          if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
             return response;
          }

          if (!babelLoaded || typeof Babel === 'undefined') {
            throw new Error("Babel Engine tidak tersedia.");
          }

          const result = Babel.transform(text, {
            presets: [
              ['react', { runtime: 'automatic' }],
              ['typescript', { isTSX: true, allExtensions: true }],
              ['env', { modules: false }]
            ],
            filename: path,
            sourceMaps: 'inline'
          }).code;

          return new Response(result, {
            headers: { 
              'Content-Type': 'application/javascript',
              'Cache-Control': 'no-cache'
            }
          });
        } catch (err) {
          console.error("[Engine Error]", err.message);
          // Berikan script yang akan memicu reload di sisi client
          return new Response(`
            console.error("Engine Transpiler Fail: ${err.message}");
            if (!window.engineErrorNotified) {
              window.engineErrorNotified = true;
              alert("Gagal memuat Mesin UI. Aplikasi akan mencoba memuat ulang secara otomatis.");
              location.reload();
            }
          `, {
            headers: { 'Content-Type': 'application/javascript' }
          });
        }
      })()
    );
  }
});
