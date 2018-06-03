
'use strict';
self.importScripts('./dist/scripts/idbHelper.js', './dist/lib/idb.js');
const cacheVersion = '1';
const dataCacheName = `mws-restaurant-static-v${cacheVersion}`;
const filesToCache = [
  '/dist/css/styles.css',
  '/dist/scripts/dbhelper.js',
  '/dist/scripts/idbhelper.js',
  '/dist/scripts/main.js',
  '/dist/scripts/restaurant_info.js',
  '/dist/lib/idb.min.js',
  'dist/lib/idb.js',
  '/dist/img/1.webp',
  '/dist/img/2.webp',
  '/dist/img/3.webp',
  '/dist/img/4.webp',
  '/dist/img/5.webp',
  '/dist/img/6.webp',
  '/dist/img/7.webp',
  '/dist/img/8.webp',
  '/dist/img/9.webp',
  '/dist/img/10.webp',
  '/img/favicon/android-chrome-192x192.png',
  '/img/favicon/android-chrome-384x384.png',
  '/img/favicon/apple-touch-icon.png',
  '/img/favicon/favicon.ico',
  '/img/favicon/mstile-150x150.png',
  '/img/favicon/safari-pinned-tab.svg',
  '/manifest.json',
];

const idbHelper = new IDBHelper(idb);

/**
 * @description It caches the list of static resources
 * @return {Promise} A promise with caches
 */
function cacheAssets () {
  return caches.open(dataCacheName).
  then(function (cache) {
    return cache.addAll(filesToCache);
  });
}

self.addEventListener('install', function (event) {
  console.log('[ServiceWorker] Install3', event);
  event.waitUntil(
    cacheAssets()
  );
});

self.addEventListener('activate', function (event) {
  console.log('Activating new service worker...', event);

  let cacheWhitelist = [filesToCache];


  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      idbHelper.deleteOldDatabase();
      idbHelper.createNewDatabase();
      return Promise.all(
        cacheNames.filter(function (cacheName) {
          return cacheName.startsWith('mws-restaurant-static') &&
            !filesToCache.includes(cacheName);
        }).map(function (cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  /*
   * Fixes a corner case in which the app wasn't returning the latest data.
   * You can reproduce the corner case by commenting out the line below and
   * then doing the following steps: 1) load app for first time so that the
   * initial data is shown 2) press the refresh button on the
   * app 3) go offline 4) reload the app. You expect to see the newer
   * data, but you actually see the initial data. This happens because the
   * service worker is not yet activated. The code below essentially lets
   * you activate the service worker faster.
   */
  return self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  if (event.request.url.indexOf('1337/restaurants') > -1) {
    console.log('request for restaurant data:', event.request.url);
    /*
     * When the request URL contains dataUrl, the app is asking for
     * json data. In this case, the service worker always goes to the
     * network and then caches the response. This is called the "Cache then
     * network" strategy:
     * https://jakearchibald.com/2014/offline-cookbook/#cache-then-network
     */
    
    event.respondWith(
      fetch(event.request)
        .then(function (response) {
          return response;
        })
        .catch(function (error) {
          console.log('error in service worker fetch: ', error);
        })
    );
  } else {
    /*
     * The app is asking for app shell files. In this scenario the app uses the
     * "Cache, falling back to the network" offline strategy:
     * https://jakearchibald.com/2014/offline-cookbook/#cache-falling-back-to-network
     */
    event.respondWith(
      caches.open(dataCacheName).then(function (cache) {
        return cache.match(event.request).then(function (response) {
          return response || fetch(event.request).then(function (response) {
            // cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
  }
});

self.addEventListener('message', function (event) {
  console.log('message event', event);
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

self.readFromIdb = () => {
  return idbHelper.readAllIdbData();
};
