const CACHE_PREFIX = 'healthaitracker-static-'
const CACHE_NAME = `${CACHE_PREFIX}v1`
const SHELL_URL = '/'

const OFFLINE_SHELL_ROUTES = new Set([
  '/',
  '/login',
  '/signup',
  '/onboarding',
  '/health',
  '/nutrition',
  '/activity',
  '/goals',
  '/progress',
  '/more',
])

const PRECACHE_ASSETS = [
  SHELL_URL,
  '/manifest.json',
  '/favicon.svg',
  '/icons/apple-touch-icon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
]

function normalizedRoute(pathname) {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }

  return pathname
}

function isHashedBuildAsset(pathname) {
  return /^\/assets\/.+-[A-Za-z0-9_-]{8,}\.[A-Za-z0-9]+$/.test(pathname)
}

function isSafeStaticResponse(response) {
  const contentType = response.headers.get('content-type') ?? ''
  return response.ok && response.type === 'basic' && !contentType.includes('application/json')
}

async function networkFirstShell(request) {
  try {
    const response = await fetch(request)
    if (isSafeStaticResponse(response) && response.headers.get('content-type')?.includes('text/html')) {
      const cache = await caches.open(CACHE_NAME)
      await cache.put(SHELL_URL, response.clone())
    }
    return response
  } catch {
    const cachedShell = await caches.match(SHELL_URL)
    if (cachedShell) {
      return cachedShell
    }

    return new Response('HealthAITracker is unavailable while offline.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}

async function cacheFirstBuildAsset(request) {
  const cached = await caches.match(request)
  if (cached) {
    return cached
  }

  const response = await fetch(request)
  if (isSafeStaticResponse(response)) {
    const cache = await caches.open(CACHE_NAME)
    await cache.put(request, response.clone())
  }
  return response
}

async function networkFirstStaticAsset(request) {
  try {
    const response = await fetch(request)
    if (isSafeStaticResponse(response)) {
      const cache = await caches.open(CACHE_NAME)
      await cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    return cached ?? Response.error()
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      ))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (url.origin !== self.location.origin || request.method !== 'GET') {
    return
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request))
    return
  }

  const route = normalizedRoute(url.pathname)
  if (request.mode === 'navigate' || url.pathname === '/index.html') {
    if (OFFLINE_SHELL_ROUTES.has(route) || url.pathname === '/index.html') {
      event.respondWith(networkFirstShell(request))
    }
    return
  }

  if (isHashedBuildAsset(url.pathname)) {
    event.respondWith(cacheFirstBuildAsset(request))
    return
  }

  if (PRECACHE_ASSETS.includes(url.pathname)) {
    event.respondWith(networkFirstStaticAsset(request))
  }
})
