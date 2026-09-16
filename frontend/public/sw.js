/* Service Worker — JBV3 / JARBOTA
 * Estrategia:
 *   - App shell: cache-first (HTML, JS, CSS)
 *   - Teselas cartográficas: stale-while-revalidate
 *   - API: network-first con fallback a IndexedDB (cola de sincronización)
 */

const CACHE_VERSION = 'jarbota-v1.0.0';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons.svg',
];

// -------- INSTALL --------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// -------- ACTIVATE --------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// -------- FETCH --------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Teselas cartográficas (OpenStreetMap, Carto, etc.)
  if (/tile|tiles|\.png$|\.jpg$/.test(url.pathname) && url.hostname !== location.hostname) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // 2. API → network-first con fallback offline
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithQueue(request));
    return;
  }

  // 3. App shell → cache-first
  event.respondWith(cacheFirst(request));
});

// -------- ESTRATEGIAS --------
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_VERSION);
    cache.put(request, response.clone());
    return response;
  } catch {
    return caches.match('/index.html');
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}

async function networkFirstWithQueue(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    // Guardar peticiones POST/PUT en IndexedDB para reintentar
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      await queueRequest(request);
      if ('sync' in self.registration) {
        try { await self.registration.sync.register('jarbota-sync'); } catch {}
      }
      return new Response(
        JSON.stringify({ offline: true, queued: true }),
        { status: 202, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return new Response('Offline', { status: 503 });
  }
}

// -------- COLA EN INDEXEDDB --------
const DB_NAME = 'jarbota-offline';
const STORE = 'sync-queue';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function queueRequest(request) {
  const body = await request.clone().text();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).add({
      url: request.url,
      method: request.method,
      headers: [...request.headers.entries()],
      body,
      timestamp: Date.now(),
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// -------- BACKGROUND SYNC --------
self.addEventListener('sync', (event) => {
  if (event.tag === 'jarbota-sync') {
    event.waitUntil(flushQueue());
  }
});

async function flushQueue() {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readonly');
  const all = await new Promise((res) => {
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => res(req.result);
  });

  for (const item of all) {
    try {
      await fetch(item.url, {
        method: item.method,
        headers: Object.fromEntries(item.headers),
        body: item.body,
      });
      const del = db.transaction(STORE, 'readwrite');
      del.objectStore(STORE).delete(item.id);
    } catch (err) {
      // Se reintentará en el próximo sync
      break;
    }
  }
}