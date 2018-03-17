var staticCacheName = 'mws-restaurant-static-v1';
var filesToCache  = [
  '.',
  'js/main.js',
  'js/dbhelper.js',
  'js/restaurant-info.js',
  'css/styles.css',
  'css/media-queries.css',
  'img/1.jpg',
  'img/2.jpg',
  'img/3.jpg',
  'img/4.jpg',
  'img/5.jpg',
  'img/6.jpg',
  'img/7.jpg',
  'img/8.jpg',
  'img/9.jpg',
  'img/10.jpg',
  'img/favicon/android-chrome-192x192.png',
  'img/favicon/android-chrome-384x384.png',
  'img/favicon/apple-touch-icon.png',
  'img/favicon/favicon.ico',
  'img/favicon/mstile-150x150.png',
  'img/favicon/safari-pinned-tab.svg',
  'data/restaurants.json'
];
var allCaches = staticCacheName;


self.addEventListener('install', function(event) {
    console.log("service worker is installed...", event);
    event.waitUntil(
      // test
      caches.open(staticCacheName)
      .then(function(cache) {
        return cache.addAll(filesToCache);
      })
    );
  });

  self.addEventListener('activate', function(event) {
    console.log('Activating new service worker...', event);

    var cacheWhitelist = [staticCacheName];

    event.waitUntil(
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    );
  });

  self.addEventListener('fetch', function(event) {
    console.log("fetch event:", event);
    var requestUrl = new URL(event.request.url);

    if (requestUrl.origin === location.origin) {
      if (requestUrl.pathname === '/') {
        event.respondWith(caches.match('/'));
        return;
      }
    }

    event.respondWith(
      caches.match(event.request).then(function(response) {
        return response || fetch(event.request);
      })
    );
  });

  self.addEventListener('message', function(event) {
    console.log("message event", event);
    if (event.data.action === 'skipWaiting') {
      self.skipWaiting();
    }
  });
