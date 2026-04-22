// ═══════════════════════════════════════════════════
// firebase-messaging-sw.js  — BR Traders v3
// Place at ROOT of deployment (same level as index.html)
// IMPORTANT: Cache version bumped to v3 — clears old stale cache
// ═══════════════════════════════════════════════════

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "AIzaSyDAGTXvnKIWSFVL3c5iMCKjrVivqGy9oCI",
  authDomain:        "painting-images.firebaseapp.com",
  projectId:         "painting-images",
  storageBucket:     "painting-images.firebasestorage.app",
  messagingSenderId: "634391472131",
  appId:             "1:634391472131:web:a38a3835931fa786220636"
});

const messaging = firebase.messaging();

// ── Background push notification handler ──────────────
messaging.onBackgroundMessage(payload => {
  const title = (payload.notification && payload.notification.title)
    ? payload.notification.title : '🎯 BR Traders Signal';
  const body  = (payload.notification && payload.notification.body)
    ? payload.notification.body  : 'New intraday signal generated';
  self.registration.showNotification(title, {
    body,
    icon:      '/icon-192.png',
    badge:     '/icon-96.png',
    vibrate:   [200, 100, 200, 100, 200],
    tag:       'br-signal',
    renotify:  true,
    data:      payload.data || {}
  });
});

// ── Notification click ────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(list => {
        for (const c of list) {
          if (c.url.includes(self.location.origin) && 'focus' in c)
            return c.focus();
        }
        if (clients.openWindow) return clients.openWindow('/');
      })
  );
});

// ── Cache — v3 clears all previous stale caches ───────
// Bug fix: old cache was serving outdated index.html
const CACHE = 'br-v3';

self.addEventListener('install', event => {
  // skipWaiting so new SW activates immediately
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(c => c.addAll(['/', '/index.html']))
  );
});

self.addEventListener('activate', event => {
  // Delete ALL old caches (br-v1, br-v2, br-traders-v1, etc.)
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Network-first for navigation — always get fresh index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          // Update cache with fresh response
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
  }
  // For everything else — network first, cache fallback
  else {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  }
});
