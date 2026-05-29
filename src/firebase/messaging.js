// ----------------------------------------------------------------------------
// Firebase Cloud Messaging (web push) helpers
// ----------------------------------------------------------------------------
import { isFirebaseConfigured, app } from './config'
import { addUserToken } from '../services/db'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

// Ask for notification permission, register the SW, fetch the FCM token, and
// store it on the user's doc so a Cloud Function can push to this device later.
export async function initMessagingForUser(userId) {
  if (!isFirebaseConfigured || !VAPID_KEY) return
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('Notification' in window)) return
  try {
    const { getMessaging, getToken, isSupported } = await import('firebase/messaging')
    if (!(await isSupported())) return

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    const messaging = getMessaging(app)
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration })
    if (token) await addUserToken(userId, token)
    return token
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[FCM] init failed:', e?.message || e)
  }
}

// Foreground messages (app is open). Returns an unsubscribe function.
export async function onForegroundMessage(cb) {
  if (!isFirebaseConfigured || !VAPID_KEY) return () => {}
  try {
    const { getMessaging, onMessage, isSupported } = await import('firebase/messaging')
    if (!(await isSupported())) return () => {}
    return onMessage(getMessaging(app), cb)
  } catch {
    return () => {}
  }
}
