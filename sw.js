
// Engine Transpiler untuk Browser
const BABEL_URL = 'https://unpkg.com/@babel/standalone/babel.min.js';

try {
  importScripts(BABEL_URL);
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
  
  // Hanya proses file dari origin yang sama
  if (url.origin === self.location.origin) {
    const path = url.pathname;
    const isTsx = path.endsWith('.tsx') || path.endsWith('.ts');
    
    if (isTsx) {
      event.respondWith(
        (async () => {
          try {
            const response = await fetch(event.request);
            if (!response.ok) return response;

            const text = await response.text();
            return transform(text, url.toString());
          } catch (err) {
            console.error('[SW] Fetch Error:', err);
            return fetch(event.request);
          }
        })()
      );
    }
  }
});

function transform(code, filename) {
  if (typeof Babel === 'undefined') {
    return new Response(code, {
      headers: { 'Content-Type': 'application/javascript' }
    });
  }

  try {
    const transformed = Babel.transform(code, {
      presets: [
        'react',
        'typescript',
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
    console.error('[SW] Transform Error:', err);
    // Kembalikan skrip yang mencetak error ke console browser agar terlihat di Console
    const errorMsg = `console.error("Gagal Kompilasi file ${filename}: ${err.message.replace(/"/g, "'")}");`;
    return new Response(errorMsg, {
      headers: { 'Content-Type': 'application/javascript' }
    });
  }
}
