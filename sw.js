
/**
 * Engine Transpiler - PUSDAL LH SUMA
 * Versi: 2.3.2 (GitHub Pages Production)
 */

const BABEL_SOURCES = [
  'https://cdn.jsdelivr.net/npm/@babel/standalone@7.24.7/babel.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.24.7/babel.min.js',
  'https://unpkg.com/@babel/standalone@7.24.7/babel.min.js'
];

let babelLoaded = false;

function loadBabel() {
  for (const src of BABEL_SOURCES) {
    if (babelLoaded) break;
    try {
      importScripts(src);
      if (typeof Babel !== 'undefined') {
        babelLoaded = true;
        console.log('[Engine] Babel Loaded via ' + src);
      }
    } catch (e) {
      console.warn('[Engine] Failed to load Babel from: ' + src);
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
  
  const path = url.pathname;
  const fileName = path.split('/').pop() || '';
  
  // Deteksi file source (TS/TSX) atau modul tanpa ekstensi
  const isSource = path.endsWith('.tsx') || 
                   path.endsWith('.ts') || 
                   (fileName && !fileName.includes('.') && !path.includes('/@') && !path.includes('node_modules') && !path.includes('/api/'));

  if (isLocal && isSource) {
    event.respondWith(
      (async () => {
        try {
          if (!babelLoaded) loadBabel();

          let content = null;
          let activePath = path;
          let fetchUrl = event.request.url;

          // Jika tanpa ekstensi, coba cari file fisiknya secara berurutan
          if (!fileName.includes('.')) {
            const extensions = ['.tsx', '.ts'];
            for (const ext of extensions) {
              try {
                const tryUrl = url.origin + path + ext + url.search;
                const testRes = await fetch(tryUrl);
                // Pastikan response oke dan bukan halaman 404 HTML milik GitHub
                if (testRes.ok && !testRes.headers.get('content-type')?.includes('text/html')) {
                  fetchUrl = tryUrl;
                  content = await testRes.text();
                  activePath = path + ext;
                  break;
                }
              } catch (e) {}
            }
          }

          if (content === null) {
            const response = await fetch(fetchUrl);
            if (!response.ok) return response;
            content = await response.text();
          }
          
          // Cegah Babel memproses halaman HTML (jika terjadi error redirect)
          if (content.trim().startsWith('<!DOCTYPE') || content.trim().startsWith('<html')) {
             return new Response(content, { headers: { 'Content-Type': 'text/html' } });
          }

          if (!babelLoaded || typeof Babel === 'undefined') {
            throw new Error("Transpiler Engine not ready.");
          }

          const result = Babel.transform(content, {
            presets: [
              ['react', { runtime: 'automatic' }],
              ['typescript', { isTSX: true, allExtensions: true }],
              ['env', { modules: false }]
            ],
            filename: activePath,
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
          return new Response(`console.error("Engine Fail: ${err.message}");`, {
            headers: { 'Content-Type': 'application/javascript' }
          });
        }
      })()
    );
  }
});
