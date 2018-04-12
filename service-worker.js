"use strict";
self.importScripts('./dist/scripts/idb/lib/idb.js');

const dataCacheName = 'mws-restaurant-static-v1';
const filesToCache  = [
  './css/styles.css',
  '/dist/scripts/dbhelper.js',
  '/dist/scripts/main.js',
  '/dist/scripts/restaurant_info.js',
  '/dist/scripts/idb/lib/idb.js',
  './img/1.jpg',
  './img/2.jpg',
  './img/3.jpg',
  './img/4.jpg',
  './img/5.jpg',
  './img/6.jpg',
  './img/7.jpg',
  './img/8.jpg',
  './img/9.jpg',
  './img/10.jpg',
  './img/favicon/android-chrome-192x192.png',
  './img/favicon/android-chrome-384x384.png',
  './img/favicon/apple-touch-icon.png',
  './img/favicon/favicon.ico',
  './img/favicon/mstile-150x150.png',
  './img/favicon/safari-pinned-tab.svg',
  './manifest.json'
];
const restaurantsJsonRequest = "http://localhost:1337/restaurants";

function openDatabase() {
  // If the browser doesn't support service worker,
  // we don't care about having a database
  if (!navigator.serviceWorker) {
    return Promise.resolve();
  }

  return idb.open('mws-restaurant', 1, function(upgradeDb) {
    var store = upgradeDb.createObjectStore('restaurants', {
      keyPath: 'id'
    });
    store.createIndex('by-date', 'time');
  });
}


function readDB() {
  self._DBPromise.then(function (db) {
    if (!db) {
      return;
    }
    var tx = db.transaction(['restaurants'], 'readonly');
    var store = tx.objectStore('restaurants');
    return store.getAll();
  }).then((items) => {
    console.log('items retrieved: ', items);
  })
}

function updateDB(restaurants) {
  self._DBPromise.then(function (db) {
    if (!db) {
      return;
    }
    var tx = db.transaction(['restaurants'], 'readwrite');
    var store = tx.objectStore('restaurants');

    restaurants.array.forEach(restaurant => {
      store.put(restaurant);
    });

  });
}

function cacheAssets() {
  return caches.open(dataCacheName)
  .then(function(cache) {
    console.log('[ServiceWorker] Caching app shell');
    return cache.addAll(filesToCache);
  });
}

self.addEventListener('install', function(event) {
  console.log('[ServiceWorker] Install');
    event.waitUntil(
      // test
      cacheAssets()
    );
  });

self.addEventListener('activate', function(event) {
    console.log('Activating new service worker...', event);

    var cacheWhitelist = [dataCacheName];

    event.waitUntil(
      caches.keys().then(function(cacheNames) {
      self._DBPromise = openDatabase();
        return Promise.all(cacheNames.map(function(cacheName) {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              console.log('[ServiceWorker] Removing old cache', cacheName);
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

self.addEventListener('fetch', function(event) {
  console.log('[Service Worker] Fetch', event.request.url);
  if (event.request.url.indexOf(restaurantsJsonRequest) > -1) {
    /*
     * When the request URL contains dataUrl, the app is asking for
     * json data. In this case, the service worker always goes to the
     * network and then caches the response. This is called the "Cache then
     * network" strategy:
     * https://jakearchibald.com/2014/offline-cookbook/#cache-then-network
     */
    event.respondWith(
      caches.open(dataCacheName).then(function (cache) {
        return fetch(event.request).then(function (response){
          cache.put(event.request.url, response.clone());
          return response;
        })
      })
    );
  } else {
    /*
     * The app is asking for app shell files. In this scenario the app uses the
     * "Cache, falling back to the network" offline strategy:
     * https://jakearchibald.com/2014/offline-cookbook/#cache-falling-back-to-network
     */
    event.respondWith(
      caches.match(event.request).then(function(response) {
        return response || fetch(event.request);
      })
    );
  }
});

self.addEventListener('message', function(event) {
  console.log("message event", event);
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
