/**
 * Cloud Function: push notifications to targeted users' devices.
 *
 * Triggers whenever a document is created in the `notifications` collection
 * (which the admin panel does on "Send notification"). It looks up the FCM
 * tokens of the targeted users and delivers the push via FCM.
 *
 * Deploy:  firebase deploy --only functions
 * Requires the Blaze (pay-as-you-go) plan — Cloud Functions need billing.
 */
const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { getMessaging } = require('firebase-admin/messaging')

initializeApp()
const db = getFirestore()

exports.pushOnNotificationCreate = onDocumentCreated('notifications/{id}', async (event) => {
  const n = event.data?.data()
  if (!n) return

  // Collect target users
  let usersSnap
  if (n.audience === 'all') {
    usersSnap = await db.collection('users').get()
  } else if (n.targetUserId) {
    const doc = await db.collection('users').doc(n.targetUserId).get()
    usersSnap = { docs: doc.exists ? [doc] : [] }
  } else {
    return
  }

  // Gather every device token across the target users
  const tokens = []
  usersSnap.docs.forEach((d) => {
    const t = d.data().fcmTokens
    if (Array.isArray(t)) tokens.push(...t)
  })
  if (tokens.length === 0) return

  // FCM allows up to 500 tokens per multicast
  const batches = []
  for (let i = 0; i < tokens.length; i += 500) batches.push(tokens.slice(i, i + 500))

  for (const batch of batches) {
    await getMessaging().sendEachForMulticast({
      tokens: batch,
      notification: { title: n.title || 'Mistri Rewards', body: n.body || '' },
      webpush: {
        notification: { icon: '/favicon.svg' },
        fcmOptions: { link: '/app/notifications' },
      },
    })
  }
})
