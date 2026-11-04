/* Shows Firebase Cloud Messaging web pushes.
 * It needs no Firebase SDK and no keys: the page subscribes with the VAPID key (see src/firebase/webPush.js)
 * and FCM delivers JSON such as { notification: { title, body, image }, data: {...}, fcmOptions: { link } }.
 * Registered with its own scope (/firebase-cloud-messaging-push-scope) next to the caching worker /sw.js. */

const sameOriginPath = (link) => {
  try {
    const url = new URL(String(link || '/'), self.location.origin);
    return url.origin === self.location.origin ? url.pathname + url.search + url.hash : '/';
  } catch (error) {
    return '/';
  }
};

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (error) {
    payload = { notification: { body: event.data ? event.data.text() : '' } };
  }
  const notification = payload.notification || {};
  const data = payload.data || {};
  const title = notification.title || data.title || 'Master Gas';
  const body = notification.body || data.body || '';
  const link = sameOriginPath((payload.fcmOptions && payload.fcmOptions.link) || notification.click_action || data.link);

  event.waitUntil(Promise.all([
    self.registration.showNotification(title, {
      body,
      icon: notification.icon || data.icon || '/favicon.png',
      image: notification.image || data.image || undefined,
      badge: '/favicon.png',
      dir: 'auto',
      tag: data.tag || payload.fcmMessageId || undefined,
      data: { link },
    }),
    // Open pages add it to their notification list.
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      windows.forEach((client) => client.postMessage({ type: 'push-message', title, body, link, data, receivedAt: Date.now() }));
    }),
  ]));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = sameOriginPath(event.notification.data && event.notification.data.link);
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
    const open = windows.find((client) => client.url.startsWith(self.location.origin));
    if (open) {
      open.postMessage({ type: 'push-open', link });
      return open.focus();
    }
    return self.clients.openWindow(link);
  }));
});
