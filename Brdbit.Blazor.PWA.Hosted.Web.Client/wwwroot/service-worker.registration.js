const CHECK_UPDATE_DELAY_MIN = 15;
let newSWcacheVersion = "";
let currentSWcacheVersion = "";

// service worker
window.updateAvailable = new Promise(function (resolve, reject) {

    if (!('serviceWorker' in navigator)) {
        const errorMessage = `Browser doesn't support service workers`;
        console.error(errorMessage);
        reject(errorMessage);
        return;
    }

    navigator.serviceWorker
        .register('service-worker.js', { updateViaCache: 'none' }) // disable retrieving service-worker-assets.js from HTTP cache to prevent integrity failures due to old cached version of service-worker-assets.js
        .then(registration => {
            console.log(`Service Worker Registered. Scope: ${registration.scope}`);
            checkForUpdate(registration, CHECK_UPDATE_DELAY_MIN);

            if (registration.active) { // currenty running sw 
                requestSWinfo(registration.active);
            }

            if (registration.waiting) { // installed waiting to restart
                requestSWinfo(registration.waiting);
                resolve({ isAvailable: true, sw: registration.waiting });
            }
            else {
                registration.onupdatefound = () => {
                    const installingWorker = registration.installing;
                    requestSWinfo(installingWorker);
                    installingWorker.onstatechange = () => {
                        switch (installingWorker.state) {
                            case 'installed':
                                requestSWinfo(installingWorker);
                                if (navigator.serviceWorker.controller) {
                                    resolve({ isAvailable: true, sw: installingWorker });
                                } else {
                                    resolve({ isAvailable: false, sw: installingWorker });
                                }
                                break;
                            case 'activated':
                                requestSWinfo(installingWorker);
                            default:
                        }
                    };
                };
            }
        })
        .catch(error => console.error('Service worker registration failed, error:', error));;
});

let refreshing = false;

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.onmessage = (event) => {
        if (event.data && event.data.code === 'GET_VERSION') {
            showSWinfo(event.data);
        }
    };

    // detect controller change and refresh the page
    navigator.serviceWorker.oncontrollerchange = () => {
        if (!refreshing) {
            window.location.reload()
            refreshing = true
        }
    };
}

// new service worker installed event handler
function registerUpdateAvailableHandler(dotNetObjectRef) {
    window['updateAvailable']
        .then(async (value) => {
            if (value && value.isAvailable) {
                console.log(`Update available`);

                var args = {
                    isUpdateReady: true
                };

                try {

                    await dotNetObjectRef.invokeMethodAsync("OnUpdateAvailable", args)
                        .then((args) => { /* args is response of .NET OnUpdateAvailable method. Could be used to change JS SW behavior */ });

                    const updateButton = document.querySelector('#btnServiceWorkerUpdate button');
                    if (updateButton) {
                        updateButton.addEventListener('click', async () => onButtonUpdateClicked(dotNetObjectRef, value.sw));
                    }
                }
                catch // need in case if dotNetObjectRef is disposed 
                // (this can happen when AppUpdateNotification blazor component is placed on few components (e.g.MainLayout and LoginLayout) and first of these components are disposed 
                // (e.g. when routed from MainLayout to Login - Main is disposed))
                {
                    console.warn("Update available but dotNetObjectRef which should be notified is disposed");
                }
            }
        });
}

async function onButtonUpdateClicked(dotNetObjectRef, installedSW)
{
    var args = {
        isApplyNewVersion: false,
        isUpdateReady: true
    }
    await dotNetObjectRef.invokeMethodAsync("OnButtonUpdateClicked", args)
        .then((args) => { /* args is response of .NET OnButtonUpdateClicked method */
            if (args.isApplyNewVersion) {
                installedSW.postMessage({ code: 'SKIP_WAITING' });
            }
        });
}

function showSWinfo(data) {
    console.log(data);
    if (data) {
        if (data.state === 'installed') {
            newSWcacheVersion = data.cacheVersion;
            updateVersionLabel('newSWversionLabel', newSWcacheVersion);
        }
        else if (data.state === 'activating' || data.state === 'activated') {
            currentSWcacheVersion = data.cacheVersion;
            updateVersionLabel('currentSWversionLabel', currentSWcacheVersion);
        }
        console.info(`Service Worker state: ${data.state}, CACHE_VERSION: ${data.cacheVersion}, CACHE_NAME: ${data.cacheName}`);
    }
}

function getCurrentSWcacheVersion() {
    return currentSWcacheVersion;
}

function getNewSWcacheVersion() {
    return newSWcacheVersion;
}

function updateVersionLabel(id, cacheVersion)
{
    const versionLabel = document.getElementById(id);

    if (versionLabel) {
        versionLabel.textContent = cacheVersion;
    }
}

function requestSWinfo(sw) {
    if (!sw) return;
    sw.postMessage({ code: 'GET_VERSION', state: sw.state });
}

function checkForUpdate(registration, delayInMinutes) {
    if (!registration) return;
    setInterval(() => {
        console.info('Periodic check for updates...');
        registration.update().catch((e) => {
            console.debug(`Check for update failed. Probably offline. ${e}`);
        });
    }, delayInMinutes * 60 * 1000);
}
