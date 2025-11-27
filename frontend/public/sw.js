// frontend/public/sw.js

// MUDE o sufixo (v3, v4...) sempre que fizer uma mudança grande
const CACHE_NAME = 'sigeceja-pwa-v3'

// O que queremos pré-cachear logo de cara
const PRECACHE_URLS = ['/', '/index.html']

self.addEventListener('install', event => {
  // instala nova versão imediatamente
  self.skipWaiting()

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_URLS)
    }),
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key)),
      ),
    ),
  )

  // faz a nova SW assumir o controle de todas as abas
  self.clients.claim()
})

// Estratégia:
// - HTML / JS / CSS / /assets => NETWORK FIRST (pega da rede e salva no cache; se cair a rede, usa cache)
// - imagens / sons / etc => CACHE FIRST (usa cache se tiver; se não, vai na rede)
self.addEventListener('fetch', event => {
  const { request } = event

  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // só cuidar de requisições do mesmo domínio
  if (url.origin !== self.location.origin) return

  const isAppShell =
    url.pathname === '/' ||
    url.pathname.endsWith('.html') ||
    url.pathname.startsWith('/assets/')

  if (isAppShell) {
    // NETWORK FIRST
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
          return response
        })
        .catch(() =>
          caches.match(request).then(
            cached => cached || caches.match('/index.html'),
          ),
        ),
    )
    return
  }

  // Outros arquivos (imagens, sons etc) → CACHE FIRST
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached
      return fetch(request).then(response => {
        const clone = response.clone()
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
        return response
      })
    }),
  )
})
