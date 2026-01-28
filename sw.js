
// Service Worker untuk transpilasi .tsx ke .js di browser secara dinamis
importScripts('https://unpkg.com/@babel/standalone/babel.min.js');

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Hanya proses permintaan dari origin yang sama
  if (url.origin === self.location.origin) {
    let path = url.pathname;
    
    // Logika Resolusi Ekstensi Otomatis:
    // Jika permintaan tidak punya ekstensi, coba cari versi .tsx atau .ts
    const isFileWithExtension = path.split('/').pop().includes('.');
    
    if (!isFileWithExtension || path.endsWith('.tsx') || path.endsWith('.ts')) {
      event.respondWith(
        (async () => {
          try {
            // Coba fetch file asli atau coba tambahkan .tsx jika tanpa ekstensi
            let fetchPath = path;
            if (!isFileWithExtension) {
              fetchPath = path + '.tsx';
            }

            let response = await fetch(fetchPath);
            
            // Jika .tsx tidak ketemu, coba .ts
            if (!response.ok && !isFileWithExtension) {
              fetchPath = path + '.ts';
              response = await fetch(fetchPath);
            }

            if (!response.ok) return response;

            const text = await response.text();
            
            const transformed = Babel.transform(text, {
              presets: [
                ['env', { modules: false }],
                ['react', { runtime: 'classic' }],
                'typescript'
              ],
              filename: fetchPath,
              sourceMaps: 'inline'
            }).code;

            return new Response(transformed, {
              headers: { 
                'Content-Type': 'application/javascript',
                'Cache-Control': 'no-cache' 
              }
            });
          } catch (err) {
            console.error('[SW] Error:', path, err);
            return fetch(event.request);
          }
        })()
      );
    }
  }
});
