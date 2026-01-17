// In development, always fetch from the network and do not enable offline support.
// This is because caching would make development more difficult (changes would not
// be reflected on the first load after each change).
const CACHE_VERSION = 'develop2222';
const cacheName = `offline-cache-develop`;

self.addEventListener('install', event => event.waitUntil(onInstall(event)));
self.addEventListener('activate', event => event.waitUntil(onActivate(event)));
self.addEventListener('fetch', () => { });
self.addEventListener('message', (event) => onMessage(event));

async function onInstall(event) {
    console.info(`Service worker: Install, CACHE_VERSION: ${CACHE_VERSION}, CACHE_NAME: ${cacheName}`);
    await forceUpdateOnOldVersion();
}

async function onActivate(event) {
    console.info(`Service worker: Activate, CACHE_VERSION: ${CACHE_VERSION}, CACHE_NAME: ${cacheName}`);
    await forceRefreshOnOldVersion();
}

async function onFetch(event) {
    return fetch(event.request);
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
        else if (event.data.code === 'SKIP_WAITING')
        {
            self.skipWaiting();
        }
    }
};

async function forceUpdateOnOldVersion() {
    if (`${CACHE_VERSION}` === '1.0.0.0') {
        self.skipWaiting();
    }
}

async function forceRefreshOnOldVersion() {
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

