// Service Worker for PWA
const CACHE_NAME = 'freedom-pos-v2'; // เปลี่ยน version
const CACHE_URLS = [
  '/',
  '/login',
  '/pos',
  '/members', 
  '/products',
  '/orders',
  '/reports',
  '/settings',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v2');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        // แคช resources ที่สำคัญก่อน
        return cache.addAll(['/', '/manifest.json']);
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Cache failed:', error);
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - Network First strategy for better reliability  
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external requests (Supabase, etc.)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip API calls and special routes
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('/_next/') ||
      event.request.url.includes('.hot-update.')) {
    return;
  }

  event.respondWith(
    // Network First - try network first, fallback to cache
    fetch(event.request)
      .then((response) => {
        // If network succeeds, cache the response
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        console.log('[SW] Network failed, trying cache for:', event.request.url);
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              console.log('[SW] Serving from cache:', event.request.url);
              return cachedResponse;
            }
            
            // If requesting a page and no cache, return index
            if (event.request.destination === 'document') {
              console.log('[SW] Serving index.html as fallback');
              return caches.match('/');
            }
            
            // For other resources, throw error
            throw new Error('No cached response available');
          });
      })
  );
});

// Background Sync for offline orders (future feature)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOfflineOrders());
  }
});

// Sync offline orders when back online
async function syncOfflineOrders() {
  try {
    // Get offline orders from IndexedDB
    const offlineOrders = await getOfflineOrders();
    
    // Send each order to server
    for (const order of offlineOrders) {
      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order)
        });
        
        if (response.ok) {
          await removeOfflineOrder(order.id);
          console.log('[SW] Synced offline order:', order.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync order:', order.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Placeholder functions for offline orders (to be implemented)
async function getOfflineOrders() {
  return [];
}

async function removeOfflineOrder(orderId) {
  // Remove from IndexedDB
}

// Push notifications (future feature)
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'มีข้อความใหม่',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'pos-notification',
    actions: [
      {
        action: 'view',
        title: 'ดู',
        icon: '/icon-192.png'
      },
      {
        action: 'dismiss',
        title: 'ปิด',
        icon: '/icon-192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Freedom POS', options)
  );
});

// Error handling for failed requests
self.addEventListener('error', (event) => {
  console.error('[SW] Service Worker Error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled Promise Rejection:', event.reason);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event);
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});