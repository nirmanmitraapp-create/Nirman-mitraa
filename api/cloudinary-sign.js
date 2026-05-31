// ----------------------------------------------------------------------------
// Vercel serverless function — signs Cloudinary uploads.
// ----------------------------------------------------------------------------
// The browser cannot hold the Cloudinary API secret, so it asks this route for
// a short-lived signature. We verify the caller is a signed-in admin, then sign
// the upload params server-side and return them. The client then POSTs the file
// directly to Cloudinary with { api_key, timestamp, folder, signature }.
//
// Required Vercel environment variables (Settings → Environment Variables):
//   CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET   from the Cloudinary dashboard
//   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY  (admin SDK)
//   ADMIN_EMAILS   comma-separated admin emails (same as VITE_ADMIN_EMAILS)
// ----------------------------------------------------------------------------
import crypto from 'node:crypto'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const UPLOAD_FOLDER = 'gifts'

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

  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME
  if (!apiKey || !apiSecret || !cloudName) {
    return res.status(500).json({ error: 'Cloudinary is not configured on the server.' })
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

    // Sign the upload params. The signed string is the params (sorted by key,
    // joined as key=value&…) with the API secret appended, hashed with SHA-1.
    const timestamp = Math.floor(Date.now() / 1000)
    const params = { folder: UPLOAD_FOLDER, timestamp }
    const toSign = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join('&')
    const signature = crypto.createHash('sha1').update(toSign + apiSecret).digest('hex')

    return res.status(200).json({ cloudName, apiKey, timestamp, folder: UPLOAD_FOLDER, signature })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Signing failed' })
  }
}
