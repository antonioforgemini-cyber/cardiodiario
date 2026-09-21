// CardioDiario Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const title = data.title || 'CardioDiario';
    const options = {
      body: data.body || 'Promemoria misurazione pressoria.',
      icon: '/icon.svg',
      badge: '/icon.svg',
      data: data.url || '/paziente/cicli',
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    console.error('Push notification error:', e);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/paziente/cicli');
      }
    })
  );
});
