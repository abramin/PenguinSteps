// ============================================
// Service Worker for Wolfwalkers' Journey
// PWA Offline Support
// ============================================

const CACHE_VERSION = 'penguin-steps-v1';

// Assets to precache on install
const PRECACHE_ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    // Icons
    './icons/icon-192.svg',
    './icons/icon-512.svg',
    // Background and UI assets
    './assets/forest_bg.png',
    './assets/parchment_texture.png',
    './assets/rune_stone.png',
    './assets/wolf_spirit_blue.png',
    './assets/wood_texture.png',
    // Exercise images
    './assets/ex_wall_calf_stretch.png',
    './assets/ex_seated_towel_stretch.png',
    './assets/ex_heel_walking.png',
    './assets/ex_band_dorsiflexion.png',
    './assets/ex_mini_squats.png',
    './assets/ex_heel_toe_walk.png',
    './assets/ex_walk_uphill.png',
    './assets/ex_one_leg_stand.png',
    './assets/ex_penguin_walk.png',
];

// Install event - precache all assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker, version:', CACHE_VERSION);

    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then((cache) => {
                console.log('[SW] Precaching app shell');
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => {
                console.log('[SW] Precache complete');
                // Don't skip waiting automatically - let the app control when to update
            })
            .catch((error) => {
                console.error('[SW] Precache failed:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker, version:', CACHE_VERSION);

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_VERSION) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[SW] Claiming clients');
                return self.clients.claim();
            })
    );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Only handle same-origin requests
    if (url.origin !== location.origin) {
        return;
    }

    // Strategy: stale-while-revalidate for index.html
    if (event.request.mode === 'navigate' || url.pathname.endsWith('index.html') || url.pathname === '/') {
        event.respondWith(staleWhileRevalidate(event.request));
        return;
    }

    // Strategy: cache-first for all other assets (css, js, images)
    event.respondWith(cacheFirst(event.request));
});

// Cache-first strategy: return cached version, fallback to network
async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) {
        return cached;
    }

    try {
        const networkResponse = await fetch(request);
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_VERSION);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.error('[SW] Fetch failed:', error);
        // Could return an offline fallback here if needed
        throw error;
    }
}

// Stale-while-revalidate: return cached, but update cache in background
async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_VERSION);
    const cachedResponse = await cache.match(request);

    const fetchPromise = fetch(request)
        .then((networkResponse) => {
            if (networkResponse.ok) {
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        })
        .catch((error) => {
            console.error('[SW] Network fetch failed:', error);
            return cachedResponse;
        });

    return cachedResponse || fetchPromise;
}

// Listen for messages from the app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('[SW] Skip waiting requested');
        self.skipWaiting();
    }
});

// Notify clients when a new version is available
self.addEventListener('install', () => {
    // After install, notify all clients about update
    self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
            client.postMessage({ type: 'UPDATE_AVAILABLE' });
        });
    });
});
