
importScripts('https://unpkg.com/@babel/standalone/babel.min.js');

self.addEventListener('install', (e) => e.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Hanya proses file dengan ekstensi .tsx atau .ts
  if (url.pathname.endsWith('.tsx') || url.pathname.endsWith('.ts')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (!response.ok) return response;
          return response.text().then(text => {
            // Transpile kode menggunakan Babel
            const transformed = Babel.transform(text, {
              presets: [
                ['env', { modules: false }],
                'react',
                'typescript'
              ],
              filename: url.pathname,
              sourceMaps: 'inline'
            }).code;

            // Kembalikan sebagai JavaScript dengan MIME type yang benar
            return new Response(transformed, {
              headers: { 'Content-Type': 'application/javascript' }
            });
          });
        })
        .catch(err => {
          console.error('Service Worker Transpilation Error:', err);
          return fetch(event.request);
        })
    );
  }
});
