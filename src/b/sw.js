// dumb hack to allow firefox to work (please dont do this in prod)
// do this in prod
if (typeof crossOriginIsolated === 'undefined' && navigator.userAgent.includes('Firefox')) {
    Object.defineProperty(self, "crossOriginIsolated", {
        value: true,
        writable: false,
    });
}

const scope = self.registration.scope;
const isScramjet = scope.endsWith('/b/s/');
const isUltraviolet = scope.endsWith('/b/u/hi/');

let scramjet;
let uv;
let scramjetConfigLoaded = false;

if (isScramjet) {
    importScripts('/b/s/scramjet.all.js');
    const { ScramjetServiceWorker } = $scramjetLoadWorker();
    scramjet = new ScramjetServiceWorker();
} else if (isUltraviolet) {
    importScripts(
        '/b/u/bunbun.js',
        '/b/u/concon.js',
        '/b/u/serser.js'
    );
    uv = new UVServiceWorker();
}

const CACHE_NAME = 'xin-cache';

self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    event.respondWith((async () => {
        try {
            if (isScramjet) {
                if (!scramjetConfigLoaded) {
                    await scramjet.loadConfig();
                    scramjetConfigLoaded = true;
                }

                if (url.pathname.startsWith('/b/s/scramjet.') && !url.pathname.endsWith('scramjet.wasm.wasm')) {
                    return fetch(request);
                }

                if (scramjet.route(event)) {
                    const response = await scramjet.fetch(event);
                    if (request.method === 'GET') {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
                    }
                    return response;
                }
            }

            if (isUltraviolet) {
                if (uv.route(event)) {
                    const response = await uv.fetch(event);
                    if (request.method === 'GET') {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
                    }
                    return response;
                }
            }

            const cache = await caches.open(CACHE_NAME);
            const cachedResponse = await cache.match(request);
            if (cachedResponse) {
                return cachedResponse;
            }

            const networkResponse = await fetch(request);
            if (request.method === 'GET' && networkResponse && networkResponse.ok) {
                const responseClone = networkResponse.clone();
                cache.put(request, responseClone);
            }
            return networkResponse;

        } catch (err) {
            return fetch(request);
        }
    })());
});