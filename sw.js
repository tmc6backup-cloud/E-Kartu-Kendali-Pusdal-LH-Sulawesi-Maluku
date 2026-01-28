
// Service Worker Engine Transpiler
importScripts('https://unpkg.com/@babel/standalone/babel.min.js');

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

// Menangani pesan skipWaiting jika dipanggil dari index.html
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  if (url.origin === self.location.origin) {
    const path = url.pathname;
    const isTsx = path.endsWith('.tsx') || path.endsWith('.ts');
    
    // Jika browser meminta file tanpa ekstensi (saat import), coba arahkan ke .tsx
    const noExtension = !path.split('/').pop().includes('.');

    if (isTsx || noExtension) {
      event.respondWith(
        (async () => {
          try {
            let fetchUrl = url.toString();
            if (noExtension) {
              fetchUrl += '.tsx';
            }

            const response = await fetch(fetchUrl);
            if (!response.ok) {
                // Jika .tsx gagal, coba .ts jika tanpa ekstensi
                if (noExtension) {
                    const tsRes = await fetch(url.toString() + '.ts');
                    if (tsRes.ok) return transform(await tsRes.text(), url.pathname + '.ts');
                }
                return response;
            }

            const text = await response.text();
            return transform(text, fetchUrl);
          } catch (err) {
            console.error('[SW] Fetch/Transform Error:', err);
            return fetch(event.request);
          }
        })()
      );
    }
  }
});

function transform(code, filename) {
  const transformed = Babel.transform(code, {
    presets: [
      ['env', { modules: false }],
      ['react', { runtime: 'classic' }],
      'typescript'
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
}
