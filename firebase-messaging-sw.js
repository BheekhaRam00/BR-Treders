// firebase-messaging-sw.js
// Place this file at the ROOT of your deployment (same level as index.html)

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDAGTXvnKIWSFVL3c5iMCKjrVivqGy9oCI",
  authDomain: "painting-images.firebaseapp.com",
  projectId: "painting-images",
  storageBucket: "painting-images.firebasestorage.app",
  messagingSenderId: "634391472131",
  appId: "1:634391472131:web:a38a3835931fa786220636"
});

const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage(payload => {
  const { title, body } = payload.notification || {};
  const notificationTitle = title || '🎯 BR Traders Signal';
  const notificationOptions = {
    body: body || 'New intraday signal generated',
    icon: '/icon-192.png',
    badge: '/icon-96.png',
    vibrate: [200, 100, 200],
    tag: 'br-traders-signal',
    renotify: true,
    data: payload.data || {}
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});

// Cache for offline capability
const CACHE_NAME = 'br-traders-v1';
const OFFLINE_URLS = ['/', '/index.html'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(cacheNames.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
  }
});
