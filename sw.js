
// Service Worker Engine Transpiler
// Menggunakan cdnjs yang biasanya lebih stabil untuk Service Workers
try {
  importScripts('https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.12/babel.min.js');
} catch (e) {
  console.error('[SW] Gagal memuat Babel Standalone:', e);
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
  
  if (url.origin === self.location.origin) {
    const path = url.pathname;
    const isTsx = path.endsWith('.tsx') || path.endsWith('.ts');
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
  // Pastikan Babel sudah terdefinisi sebelum digunakan
  if (typeof Babel === 'undefined') {
    console.error('[SW] Babel belum siap. Mengirimkan kode mentah.');
    return new Response(code, {
      headers: { 'Content-Type': 'application/javascript' }
    });
  }

  try {
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
  } catch (err) {
    console.error('[SW] Transpile Error at ' + filename + ':', err);
    // Kembalikan error agar mudah di-debug di console browser
    return new Response(`console.error("Transpile Error: ${err.message}");`, {
      headers: { 'Content-Type': 'application/javascript' }
    });
  }
}
