// ----------------------------------------------------------------------------
// Vercel serverless function — sends FCM background push notifications.
// ----------------------------------------------------------------------------
// Runs on Vercel's free tier (no Firebase Blaze plan needed). The admin app
// calls this route after creating a `notifications` doc. It verifies the caller
// is an admin, looks up the targeted users' FCM tokens, and delivers the push.
//
// Required Vercel environment variables (Settings → Environment Variables):
//   FIREBASE_PROJECT_ID    e.g. nirmanmitra-46289
//   FIREBASE_CLIENT_EMAIL  from the service account JSON
//   FIREBASE_PRIVATE_KEY   from the service account JSON (paste the whole key,
//                          including the BEGIN/END lines and the \n escapes)
//   ADMIN_EMAILS           comma-separated admin emails (same as VITE_ADMIN_EMAILS)
// ----------------------------------------------------------------------------
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'

// Initialize the Admin SDK once (reused across warm invocations).
function admin() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Vercel stores newlines as literal "\n" — turn them back into real ones.
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      }),
    })
  }
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || process.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    admin()

    // 1. Verify the caller is a signed-in admin.
    const authHeader = req.headers.authorization || ''
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!idToken) return res.status(401).json({ error: 'Missing auth token' })

    const decoded = await getAuth().verifyIdToken(idToken)
    const email = (decoded.email || '').toLowerCase()
    if (!ADMIN_EMAILS.includes(email)) {
      return res.status(403).json({ error: 'Not an admin' })
    }

    // 2. Read the notification payload.
    const { title = 'Mistri Rewards', body = '', audience = 'all', targetUserId = null } =
      req.body || {}

    // 3. Collect target users' FCM tokens.
    const db = getFirestore()
    let userDocs = []
    if (audience === 'all') {
      const snap = await db.collection('users').get()
      userDocs = snap.docs
    } else if (targetUserId) {
      const doc = await db.collection('users').doc(targetUserId).get()
      if (doc.exists) userDocs = [doc]
    }

    const tokens = []
    userDocs.forEach((d) => {
      const t = d.data().fcmTokens
      if (Array.isArray(t)) tokens.push(...t)
    })
    if (tokens.length === 0) return res.status(200).json({ sent: 0 })

    // 4. Send via FCM (up to 500 tokens per multicast).
    const messaging = getMessaging()
    let sent = 0
    const invalid = []
    for (let i = 0; i < tokens.length; i += 500) {
      const batch = tokens.slice(i, i + 500)
      const resp = await messaging.sendEachForMulticast({
        tokens: batch,
        // Data-only message: guarantees the service worker's onBackgroundMessage
        // handler runs and shows the notification (avoids the browser auto-display
        // ambiguity of `notification` messages). All values must be strings.
        data: {
          title: String(title),
          body: String(body),
          link: '/app/notifications',
        },
        webpush: {
          headers: { Urgency: 'high' },
          fcmOptions: { link: '/app/notifications' },
        },
      })
      sent += resp.successCount
      resp.responses.forEach((r, idx) => {
        if (
          !r.success &&
          ['messaging/registration-token-not-registered', 'messaging/invalid-argument'].includes(
            r.error?.code,
          )
        ) {
          invalid.push(batch[idx])
        }
      })
    }

    // 5. Best-effort cleanup of dead tokens so they don't pile up.
    if (invalid.length) {
      const { FieldValue } = await import('firebase-admin/firestore')
      await Promise.all(
        userDocs.map((d) => {
          const t = d.data().fcmTokens
          if (Array.isArray(t) && t.some((x) => invalid.includes(x))) {
            return d.ref.update({ fcmTokens: FieldValue.arrayRemove(...invalid) })
          }
          return null
        }),
      )
    }

    return res.status(200).json({ sent })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Push failed' })
  }
}
