// ── PORTUGUÊS PLANNER — SERVICE WORKER ──
// Jede Versionsänderung hier löscht den alten Cache und lädt neu.
const CACHE_NAME = 'pt-planner-v1';

// Alle Dateien die offline verfügbar sein sollen
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './logo.png',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Nunito:wght@400;500;600;700;800&display=swap'
];

// INSTALL: Dateien in den Cache laden
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  // Sofort aktivieren ohne auf alte Tabs zu warten
  self.skipWaiting();
});

// ACTIVATE: Alten Cache löschen
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// FETCH: Anfragen abfangen — erst Cache, dann Netzwerk
self.addEventListener('fetch', event => {
  // Firebase-Anfragen immer vom Netzwerk (nicht cachen)
  if (event.request.url.includes('firebase') || event.request.url.includes('google')) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Nur gültige Antworten cachen
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const toCache = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, toCache));
        return response;
      });
    }).catch(() => caches.match('./index.html'))
  );
});
