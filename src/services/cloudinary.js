// Signed client-side image uploads to Cloudinary.
// The browser asks /api/cloudinary-sign for a signature (the API secret stays
// server-side), then uploads the file directly to Cloudinary.

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME

export const isCloudinaryConfigured = Boolean(CLOUD_NAME)

// True for stored image values that are remote URLs (vs. emoji icons).
export const isImageUrl = (s) => typeof s === 'string' && /^https?:\/\//.test(s)

/**
 * Upload a File/Blob to Cloudinary and resolve with the secure HTTPS URL.
 * Throws on misconfiguration, an unauthenticated/non-admin caller, or a failed upload.
 */
export async function uploadImage(file) {
  if (!isCloudinaryConfigured) {
    throw new Error('Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME in your .env.')
  }
  if (!file) throw new Error('No file selected.')
  if (!file.type?.startsWith('image/')) throw new Error('Please choose an image file.')
  if (file.size > 10 * 1024 * 1024) throw new Error('Image is too large (max 10 MB).')

  // 1. Get a signature from our serverless function (verifies admin session).
  const { auth } = await import('../firebase/config')
  const idToken = await auth?.currentUser?.getIdToken?.()
  if (!idToken) throw new Error('You must be signed in as an admin to upload images.')

  const signRes = await fetch('/api/cloudinary-sign', {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}` },
  })
  let sign = {}
  try { sign = await signRes.json() } catch { /* non-JSON (e.g. 404 in local `vite` dev) */ }
  if (!signRes.ok) {
    throw new Error(sign.error || `Could not sign upload (HTTP ${signRes.status}). The /api function must be deployed (Vercel or \`vercel dev\`).`)
  }

  // 2. Upload directly to Cloudinary with the signed params.
  const body = new FormData()
  body.append('file', file)
  body.append('api_key', sign.apiKey)
  body.append('timestamp', sign.timestamp)
  body.append('folder', sign.folder)
  body.append('signature', sign.signature)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`, {
    method: 'POST',
    body,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.error?.message || `Upload failed (HTTP ${res.status}).`)
  }
  return data.secure_url
}
