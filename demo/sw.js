var CACHE_NAME = 'my-site-cache-v1';
var urlsToCache = [
  './',
  './app.js',
  './styles.css',
  './fallback.json',
  './images/fetch-dog.jpg'
];

self.addEventListener('install', function (event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );


  console.log('install');
});

/*
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
*/

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (url.origin === location.origin) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(networkFirst(request));
  }
  /*
    self.registration.showNotification('Vibration Sample', {
      body: 'Buzz! Buzz!',
      icon: '../images/touch/chrome-touch-icon-192x192.png',
      vibrate: [200, 100, 200, 100, 200, 100, 200],
      tag: 'vibration-sample'
    });
  */
});

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  return cachedResponse || await fetch(request);
}

async function networkFirst(request) {
  const dynamicCache = await caches.open(CACHE_NAME);
  try {
    const networkResponse = await fetch(request);
    if (request.method == 'GET') {
      dynamicCache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    const cachedResponse = await dynamicCache.match(request);
    return cachedResponse || await caches.match('./fallback.json');
  }
}

self.addEventListener('push', function (event) {
  var data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      data: event.data.json(),
      icon: './images/icons/icon-192x192.png',
      vibrate: [200, 100, 200, 100, 200, 100, 200],
      image: 'https://developers.google.com/web/fundamentals/push-notifications/images/notification-ui.png',
      badge: './images/icons/icon-192x192.png',
    })
  );
});


// Notification click event listener
self.addEventListener('notificationclick', e => {
  var url = self.location.origin + e.notification.data.path;
  // Close the notification popout
  e.notification.close();
  // Get all the Window clients
  e.waitUntil(clients.matchAll({ type: 'window' }).then(clientsArr => {
    // If a Window tab matching the targeted URL already exists, focus that;
    const hadWindowToFocus = clientsArr.some(windowClient => windowClient.url === url ? (windowClient.focus(), true) : false);
    // Otherwise, open a new tab to the applicable URL and focus it.
    if (!hadWindowToFocus) clients.openWindow(url).then(windowClient => windowClient ? windowClient.focus() : null);
  }));
});