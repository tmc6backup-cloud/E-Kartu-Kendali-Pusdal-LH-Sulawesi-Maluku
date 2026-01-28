
// Service Worker dinonaktifkan untuk stabilitas di lingkungan sandbox
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
