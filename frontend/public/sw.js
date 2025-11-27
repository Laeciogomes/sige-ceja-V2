const CACHE_NAME = 'sige-ceja-cache-v1'

// arquivos básicos para funcionar offline de forma simples
const URLS_TO_CACHE = ['/', '/index.html', '/favicon.ico', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE)),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  )
})

// estratégia simples: cache-first para GET
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response
      return fetch(event.request)
    }),
  )
})
