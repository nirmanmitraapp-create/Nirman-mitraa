# 🔔 Push notifications — setup guide

When the admin sends a notification, targeted users are reached in two ways:

| Scenario | Mechanism | Needs a backend? |
|---|---|---|
| User has the app **open** | Real-time Firestore listener → in-app toast + browser notification + bell badge | ❌ No — works now |
| User's app is **closed / background** | Firebase Cloud Messaging (FCM) + the Cloud Function | ✅ Yes (Blaze plan) |

The in-app path is already live. To enable true background push, do the steps below.

## 1. Generate a Web Push (VAPID) key
Firebase Console → **Project settings → Cloud Messaging → Web Push certificates** →
**Generate key pair**. Copy it into `.env`:

```
VITE_FIREBASE_VAPID_KEY=BNxxxxxxx...your_key...
```
Restart `npm run dev`. On next login the app asks for notification permission and
saves the device's FCM token to the user's Firestore doc (`fcmTokens`).

## 2. Deploy the Cloud Function
The function in [`functions/index.js`](functions/index.js) triggers on every new
`notifications` document and pushes to the targeted users' tokens.

```bash
npm i -g firebase-tools
firebase login
firebase use nirmanmitra-46289
cd functions && npm install && cd ..
firebase deploy --only functions
```

> ⚠️ Cloud Functions require the **Blaze (pay-as-you-go)** plan. FCM itself is free;
> the Blaze plan is only needed to run the function. There's a generous free tier.

## 3. Test
1. Open the user app in one browser (grant the notification permission prompt).
2. In another browser, log in as admin → **Notifications** → send a message.
3. App open → instant in-app toast + browser notification.
4. App closed (after function is deployed) → OS push notification.

## Files involved
- [`src/firebase/messaging.js`](src/firebase/messaging.js) — permission, token, foreground messages
- [`public/firebase-messaging-sw.js`](public/firebase-messaging-sw.js) — background push handler
- [`src/components/layout/UserLayout.jsx`](src/components/layout/UserLayout.jsx) — real-time listener, toast, badge
- [`functions/index.js`](functions/index.js) — server-side fan-out to device tokens

## Notes
- The service worker has the Firebase config inlined (it can't read `.env`). These
  keys are public and safe to expose; keep them in sync if you change projects.
- Add `fcmTokens` read access only to admins/functions in your Firestore rules if you
  want to lock it down (the function uses the Admin SDK and bypasses rules).
