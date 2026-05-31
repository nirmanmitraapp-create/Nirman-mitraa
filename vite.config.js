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

export default defineConfig({
  plugins: [react(), tailwindcss(), cloudinarySignPlugin()],
  server: {
    host: true,
    port: 5173,
  },
})
