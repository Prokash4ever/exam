// ==================== SERVICE WORKER ====================

const CACHE_NAME = 'mr-stylo-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/main.css',
  '/css/responsive.css',
  '/css/components.css',
  '/css/admin.css',
  '/js/main.js',
  '/js/exam.js',
  '/js/admin.js',
  '/js/utils.js',
  '/js/auth.js',
  '/js/storage.js',
  '/js/mathjax-loader.js',
  '/firebase-config.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;600;700&family=Poppins:wght@400;500;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip Firebase requests (keep them online)
  if (event.request.url.includes('firebase')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Open cache and put the new response
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // If fetch fails, show offline page
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Background sync for offline data
self.addEventListener('sync', event => {
  if (event.tag === 'sync-results') {
    event.waitUntil(syncResults());
  }
});

// Sync results when back online
async function syncResults() {
  try {
    const results = await getPendingResults();
    
    for (const result of results) {
      await syncResultToServer(result);
      await removePendingResult(result.id);
    }
    
    console.log('Results synced successfully');
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// Get pending results from IndexedDB
async function getPendingResults() {
  return new Promise((resolve) => {
    const request = indexedDB.open('MrStyloDB', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['pendingResults'], 'readonly');
      const store = transaction.objectStore('pendingResults');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result || []);
      };
    };
    
    request.onerror = () => resolve([]);
  });
}

// Remove pending result
async function removePendingResult(id) {
  return new Promise((resolve) => {
    const request = indexedDB.open('MrStyloDB', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['pendingResults'], 'readwrite');
      const store = transaction.objectStore('pendingResults');
      store.delete(id);
      transaction.oncomplete = () => resolve();
    };
  });
}

// Push notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data?.text() || 'New notification from Mr. Stylo Academy',
    icon: 'assets/icons/icon-192x192.png',
    badge: 'assets/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Mr. Stylo Academy', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

// Message handler
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Periodic sync (for background updates)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', event => {
    if (event.tag === 'update-content') {
      event.waitUntil(updateContent());
    }
  });
}

// Update content in background
async function updateContent() {
  const cache = await caches.open(CACHE_NAME);
  const requests = urlsToCache;
  
  for (const url of requests) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
      }
    } catch (error) {
      console.log(`Failed to update ${url}:`, error);
    }
  }
}