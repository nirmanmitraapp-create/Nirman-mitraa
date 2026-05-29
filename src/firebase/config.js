// ----------------------------------------------------------------------------
// Firebase initialization
// ----------------------------------------------------------------------------
// If the required env vars are present, real Firebase is initialized.
// If they are missing, `isFirebaseConfigured` is false and the rest of the app
// transparently falls back to a localStorage-backed DEMO MODE.
// ----------------------------------------------------------------------------
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
)

export const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((p) => p.trim().toLowerCase())
  .filter(Boolean)

export const isAdminEmail = (email) =>
  Boolean(email) && ADMIN_EMAILS.includes(String(email).toLowerCase())

let app = null
let auth = null
let db = null

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  // Auto-detect long-polling so Firestore still connects on networks/proxies
  // that block its default streaming transport (prevents "client is offline").
  db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  })
} else {
  // eslint-disable-next-line no-console
  console.warn(
    '%c[Mistri Rewards] Running in DEMO MODE (no Firebase config found).\n' +
      'Add your Firebase keys to .env to enable real phone-OTP auth + Firestore.',
    'color:#0f766e;font-weight:bold',
  )
}

export { app, auth, db }
