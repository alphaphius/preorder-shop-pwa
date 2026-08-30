const VERSION = 'preorder-shop-shell-v2'
const scopeUrl = new URL(self.registration.scope)
const asset = (name) => new URL(name, scopeUrl).toString()
const SHELL = [asset(''), asset('index.html'), asset('manifest.webmanifest'), asset('icon.svg'), asset('runtime-config.js')]

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()))
})
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key)))).then(() => self.clients.claim()))
})
self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.hostname === 'script.google.com' || url.hostname.endsWith('googleusercontent.com')) return
  if (url.origin !== location.origin) return
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(asset('index.html'))))
    return
  }
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok && ['script', 'style', 'font', 'image'].includes(request.destination)) {
      const copy = response.clone(); caches.open(VERSION).then((cache) => cache.put(request, copy))
    }
    return response
  })))
})
