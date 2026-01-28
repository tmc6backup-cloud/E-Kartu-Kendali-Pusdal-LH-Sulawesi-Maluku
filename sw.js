
/**
 * Service Worker Engine - E-Kartu Kendali
 * Berfungsi sebagai compiler on-the-fly di dalam browser.
 */

const BABEL_SOURCES = [
  'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.12/babel.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://cdn.jsdelivr.net/npm/@babel/standalone/babel.min.js'
];

// Mencoba memuat Babel dari beberapa sumber jika satu gagal
let babelLoaded = false;
for (const src of BABEL_SOURCES) {
  if (babelLoaded) break;
  try {
    importScripts(src);
    babelLoaded = true;
    console.log('[SW] Babel berhasil dimuat dari:', src);
  } catch (e) {
    console.warn('[SW] Gagal memuat Babel dari ' + src + ', mencoba sumber lain...');
  }
}

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Hanya proses file dari origin yang sama (lokal)
  if (url.origin === self.location.origin) {
    const path = url.pathname;
    // Periksa apakah ini file source (ts/tsx)
    if (path.endsWith('.tsx') || path.endsWith('.ts')) {
      event.respondWith(
        (async () => {
          try {
            const response = await fetch(event.request);
            
            // Jika file tidak ditemukan (404), jangan kirimkan sebagai JS
            if (!response.ok) {
              console.error(`[SW] File tidak ditemukan: ${path} (Status: ${response.status})`);
              return response; 
            }

            const contentType = response.headers.get('content-type');
            // Jika server malah mengembalikan HTML (misal redirect 404), hentikan
            if (contentType && contentType.includes('text/html')) {
              console.error(`[SW] Mendapat HTML saat meminta file source untuk ${path}. Kemungkinan 404 redirect.`);
              return new Response(`console.error("File ${path} tidak ditemukan (Server mengembalikan HTML)");`, {
                headers: { 'Content-Type': 'application/javascript' }
              });
            }

            const text = await response.text();
            return transform(text, url.toString());
          } catch (err) {
            console.error(`[SW] Gagal memproses ${path}:`, err);
            return new Response(`console.error("Fetch Error pada ${path}: ${err.message}");`, {
              headers: { 'Content-Type': 'application/javascript' }
            });
          }
        })()
      );
    }
  }
});

function transform(code, filename) {
  if (!babelLoaded || typeof Babel === 'undefined') {
    const msg = "Babel Standalone gagal dimuat. Engine tidak bisa bekerja.";
    console.error(`[SW] ${msg}`);
    return new Response(`console.error("${msg}");`, {
      headers: { 'Content-Type': 'application/javascript' }
    });
  }

  try {
    const transformed = Babel.transform(code, {
      presets: [
        ['react', { runtime: 'classic' }],
        ['typescript', { isTSX: true, allExtensions: true }],
        ['env', { modules: false }]
      ],
      filename: filename,
      sourceMaps: 'inline'
    }).code;

    return new Response(transformed, {
      headers: { 
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (err) {
    console.error(`[SW] Kesalahan Kompilasi pada ${filename}:`, err);
    // Mengembalikan script yang akan mencetak error ke console browser pengguna
    const cleanError = err.message.replace(/"/g, "'").replace(/\n/g, " ");
    return new Response(`console.error("Babel Kompilasi Error [${filename}]: ${cleanError}");`, {
      headers: { 'Content-Type': 'application/javascript' }
    });
  }
}
