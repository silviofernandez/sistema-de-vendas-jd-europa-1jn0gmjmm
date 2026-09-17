const CACHE_NAME = 'jd-europa-shell-v1'
const ASSETS_TO_CACHE = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg', '/favicon.ico']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {})
    }),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key)
          }
        }),
      )
    }),
  )
  self.clients.claim()
})

// Network-first com fallback para cache do shell da aplicação
self.addEventListener('fetch', (event) => {
  const request = event.request

  // Não intercepta chamadas de API do PocketBase nem chamadas de backend
  if (
    request.method !== 'GET' ||
    request.url.includes('/api/') ||
    request.url.includes('/backend/')
  ) {
    return
  }

  // Para navegações de página (HTML)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html') || caches.match('/')
      }),
    )
    return
  }

  // Para assets estáticos: tenta rede, fallback para cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache)
          })
        }
        return response
      })
      .catch(() => {
        return caches.match(request)
      }),
  )
})
