// Caution! Be sure you understand the caveats before publishing an application with
// offline support. See https://aka.ms/blazor-offline-considerations

const CACHE_VERSION = "1.0.0.1";

self.importScripts('./service-worker-assets.js');
self.addEventListener('install', event => event.waitUntil(onInstall(event)));
self.addEventListener('activate', event => event.waitUntil(onActivate(event)));
self.addEventListener('fetch', event => event.respondWith(onFetch(event)));
self.addEventListener('message', (event) => onMessage(event));

const cacheNamePrefix = 'offline-cache-';
const cacheName = `${cacheNamePrefix}${self.assetsManifest.version}`;
const offlineAssetsInclude = [/\.dll$/, /\.pdb$/, /\.wasm/, /\.html/, /\.js$/, /\.json$/, /\.css$/, /\.woff$/, /\.png$/, /\.jpe?g$/, /\.gif$/, /\.ico$/, /\.blat$/, /\.dat$/];
const offlineAssetsExclude = [/^service-worker\.js$/];

async function onInstall(event) {
    console.info(`Service worker: Install, CACHE_VERSION: ${CACHE_VERSION}, CACHE_NAME: ${cacheName}`);

    // Fetch and cache all matching items from the assets manifest
    const assetsRequests = self.assetsManifest.assets
        .filter(asset => offlineAssetsInclude.some(pattern => pattern.test(asset.url)))
        .filter(asset => !offlineAssetsExclude.some(pattern => pattern.test(asset.url)))
        .map(asset => new Request(asset.url, { integrity: asset.hash, cache: 'no-cache' }));
    await caches.open(cacheName).then(cache => cache.addAll(assetsRequests));

    await forceUpdateOnOldVersion();
}

async function onActivate(event) {
    console.info(`Service worker: Activate, CACHE_VERSION: ${CACHE_VERSION}, CACHE_NAME: ${cacheName}`);

    // Delete unused caches
    const cacheKeys = await caches.keys();
    await Promise.all(cacheKeys
        .filter(key => key.startsWith(cacheNamePrefix) && key !== cacheName)
        .map(key => caches.delete(key)));

    await forceRefreshOnOldVersion();
}

async function onFetch(event) {
    let cachedResponse = null;
    if (event.request.method === 'GET') {
        // For all navigation requests, try to serve index.html from cache
        // If you need some URLs to be server-rendered, edit the following check to exclude those URLs
        const shouldServeIndexHtml = event.request.mode === 'navigate'
            && !event.request.url.includes('/bff/')
            && !event.request.url.includes('/signin')
            && !event.request.url.includes('/signout');

        const request = shouldServeIndexHtml ? 'index.html' : event.request;
        const cache = await caches.open(cacheName);
        cachedResponse = await cache.match(request);
    }

    return cachedResponse || fetch(event.request);
}

async function onMessage(event) {
    if (event.data) {
        if (event.data.code === 'GET_VERSION') {
            await self.clients.get(event.source.id)
                .then((client) => {
                    if (client) {
                        client.postMessage({
                            code: event.data.code,
                            state: event.data.state,
                            cacheVersion: CACHE_VERSION,
                            cacheName: cacheName,
                        });
                    }
                });
        }
        else if (event.data.code === 'SKIP_WAITING') {
            self.skipWaiting();
        }
    }
};

async function forceUpdateOnOldVersion() {
    if (`${CACHE_VERSION}` === '1.0.0.0') {
        self.skipWaiting();
    }
}

async function forceRefreshOnOldVersion()
{
    if (`${CACHE_VERSION}` === '1.0.0.0') {
        await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clients) => {
                for (const client of clients) {
                    if (client) {
                        client.navigate(client.url).catch(error => console.warn(error));
                    }
                }
            });
    }
}


