// ----------------------------------------------------------------------------
// Vercel serverless function — permanently deletes a user's Firebase Auth
// account by uid, using the Admin SDK.
// ----------------------------------------------------------------------------
// Runs on Vercel's free tier (no Firebase Blaze plan needed), same pattern as
// /api/send-push.js and /api/cloudinary-sign.js. The client SDK can only ever
// delete the *currently signed-in* user, so removing someone else's Auth
// account (what "Delete User" in the admin panel needs) requires the Admin
// SDK, which must run on a trusted server — never in the browser.
//
// Required Vercel environment variables (already set for the other routes):
//   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
//   ADMIN_EMAILS   comma-separated admin emails (same as VITE_ADMIN_EMAILS)
// ----------------------------------------------------------------------------
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

function admin() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
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

    // Verify the caller is a signed-in admin.
    const authHeader = req.headers.authorization || ''
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!idToken) return res.status(401).json({ error: 'Missing auth token' })
    const decoded = await getAuth().verifyIdToken(idToken)
    const email = (decoded.email || '').toLowerCase()
    if (!ADMIN_EMAILS.includes(email)) {
      return res.status(403).json({ error: 'Not an admin' })
    }

    const { uid } = req.body || {}
    if (!uid) return res.status(400).json({ error: 'Missing uid' })

    try {
      await getAuth().deleteUser(uid)
    } catch (e) {
      // Already gone (e.g. previously cleaned up) — treat as success.
      if (e?.code !== 'auth/user-not-found') throw e
    }

    return res.status(200).json({ success: true })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Delete failed' })
  }
}
