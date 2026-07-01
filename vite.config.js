import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import crypto from 'node:crypto'

// Dev-only middleware that mirrors /api/cloudinary-sign so uploads work with
// plain `vite dev` (no `vercel dev` needed). In production the real Vercel
// serverless function in /api/cloudinary-sign.js handles the route.
function cloudinarySignPlugin() {
  return {
    name: 'cloudinary-sign',
    configureServer(server) {
      server.middlewares.use('/api/cloudinary-sign', (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405).end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }
        const env = loadEnv('development', process.cwd(), '') // reads ALL env vars (no VITE_ filter)
        const apiKey    = env.CLOUDINARY_API_KEY
        const apiSecret = env.CLOUDINARY_API_SECRET
        const cloudName = env.CLOUDINARY_CLOUD_NAME || env.VITE_CLOUDINARY_CLOUD_NAME
        if (!apiKey || !apiSecret || !cloudName) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Cloudinary env vars not set in .env' }))
          return
        }
        const timestamp = Math.floor(Date.now() / 1000)
        const folder = 'gifts'
        const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`
        const signature = crypto.createHash('sha1').update(toSign).digest('hex')
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ cloudName, apiKey, timestamp, folder, signature }))
      })
    },
  }
}

// Dev-only middleware that mirrors /api/send-push so FCM push works with
// plain `vite dev`. In production the Vercel serverless function handles it.
function sendPushPlugin() {
  return {
    name: 'send-push',
    configureServer(server) {
      server.middlewares.use('/api/send-push', (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }
        let raw = ''
        req.on('data', (chunk) => { raw += chunk })
        req.on('end', async () => {
          const json = (body, status = 200) => {
            res.writeHead(status, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(body))
          }
          try {
            const env = loadEnv('development', process.cwd(), '')
            const payload = JSON.parse(raw || '{}')

            const { initializeApp, getApps, cert } = await import('firebase-admin/app')
            const { getAuth } = await import('firebase-admin/auth')
            const { getFirestore } = await import('firebase-admin/firestore')
            const { getMessaging } = await import('firebase-admin/messaging')

            if (!getApps().length) {
              initializeApp({
                credential: cert({
                  projectId: env.FIREBASE_PROJECT_ID,
                  clientEmail: env.FIREBASE_CLIENT_EMAIL,
                  privateKey: (env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
                }),
              })
            }

            const idToken = (req.headers.authorization || '').replace('Bearer ', '') || null
            if (!idToken) return json({ error: 'Missing auth token' }, 401)

            const decoded = await getAuth().verifyIdToken(idToken)
            const email = (decoded.email || '').toLowerCase()
            const adminEmails = (env.ADMIN_EMAILS || env.VITE_ADMIN_EMAILS || '')
              .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
            if (!adminEmails.includes(email)) return json({ error: 'Not an admin' }, 403)

            const { title = 'Mistri Rewards', body = '', audience = 'all', targetUserId = null } = payload
            const db = getFirestore()
            let userDocs = []
            if (audience === 'all') {
              userDocs = (await db.collection('users').get()).docs
            } else if (targetUserId) {
              const d = await db.collection('users').doc(targetUserId).get()
              if (d.exists) userDocs = [d]
            }

            const tokens = userDocs.flatMap((d) => d.data().fcmTokens || [])
            if (!tokens.length) return json({ sent: 0 })

            const messaging = getMessaging()
            let sent = 0
            const invalid = []
            for (let i = 0; i < tokens.length; i += 500) {
              const batch = tokens.slice(i, i + 500)
              const resp = await messaging.sendEachForMulticast({
                tokens: batch,
                notification: { title: String(title), body: String(body) },
                data: { title: String(title), body: String(body), link: '/app/notifications' },
                webpush: { headers: { Urgency: 'high' }, fcmOptions: { link: '/app/notifications' } },
              })
              sent += resp.successCount
              resp.responses.forEach((r, idx) => {
                if (!r.success && ['messaging/registration-token-not-registered', 'messaging/invalid-argument'].includes(r.error?.code)) {
                  invalid.push(batch[idx])
                }
              })
            }

            if (invalid.length) {
              const { FieldValue } = await import('firebase-admin/firestore')
              await Promise.all(userDocs.map((d) => {
                const t = d.data().fcmTokens
                if (Array.isArray(t) && t.some((x) => invalid.includes(x))) {
                  return d.ref.update({ fcmTokens: FieldValue.arrayRemove(...invalid) })
                }
              }))
            }

            json({ sent })
          } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: e?.message || 'Push failed' }))
          }
        })
      })
    },
  }
}

// Dev-only middleware that mirrors /api/delete-user so account deletion works
// with plain `vite dev`. In production the Vercel serverless function handles it.
function deleteUserPlugin() {
  return {
    name: 'delete-user',
    configureServer(server) {
      server.middlewares.use('/api/delete-user', (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }
        let raw = ''
        req.on('data', (chunk) => { raw += chunk })
        req.on('end', async () => {
          const json = (body, status = 200) => {
            res.writeHead(status, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(body))
          }
          try {
            const env = loadEnv('development', process.cwd(), '')
            const payload = JSON.parse(raw || '{}')

            const { initializeApp, getApps, cert } = await import('firebase-admin/app')
            const { getAuth } = await import('firebase-admin/auth')

            if (!getApps().length) {
              initializeApp({
                credential: cert({
                  projectId: env.FIREBASE_PROJECT_ID,
                  clientEmail: env.FIREBASE_CLIENT_EMAIL,
                  privateKey: (env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
                }),
              })
            }

            const idToken = (req.headers.authorization || '').replace('Bearer ', '') || null
            if (!idToken) return json({ error: 'Missing auth token' }, 401)

            const decoded = await getAuth().verifyIdToken(idToken)
            const email = (decoded.email || '').toLowerCase()
            const adminEmails = (env.ADMIN_EMAILS || env.VITE_ADMIN_EMAILS || '')
              .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
            if (!adminEmails.includes(email)) return json({ error: 'Not an admin' }, 403)

            const { uid } = payload
            if (!uid) return json({ error: 'Missing uid' }, 400)

            try {
              await getAuth().deleteUser(uid)
            } catch (e) {
              if (e?.code !== 'auth/user-not-found') throw e
            }

            json({ success: true })
          } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: e?.message || 'Delete failed' }))
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), cloudinarySignPlugin(), sendPushPlugin(), deleteUserPlugin()],
  server: {
    host: true,
    port: 5173,
  },
})
