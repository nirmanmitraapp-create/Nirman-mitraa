/* Firebase Cloud Messaging — background push handler.
   This file lives in /public so it is served at the site root.
   Config values are public (safe to expose). Keep in sync with .env. */

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyD73JcvBAM8KfkJ3IR8W8U9kgS2xb1-rZg',
  authDomain: 'nirmanmitra-46289.firebaseapp.com',
  projectId: 'nirmanmitra-46289',
  storageBucket: 'nirmanmitra-46289.firebasestorage.app',
  messagingSenderId: '148908172695',
  appId: '1:148908172695:web:1f051ece98fec7286190d2',
})

const messaging = firebase.messaging()

// Shown when the app is in the background / closed.
// Data-only messages: title/body come from payload.data.
messaging.onBackgroundMessage((payload) => {
  const d = payload.data || {}
  const title = d.title || 'Mistri Rewards'
  self.registration.showNotification(title, {
    body: d.body || '',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: { link: d.link || '/app/notifications' },
  })
})

// Focus/open the app when a notification is clicked.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const link = event.notification.data?.link || '/app/notifications'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          if (client.navigate) client.navigate(link)
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(link)
    }),
  )
})
