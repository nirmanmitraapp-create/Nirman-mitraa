# 🏗️ Mistri Rewards — Loyalty & Referral Platform

A fully responsive (320px → 1980px) React app for a building-materials shop's loyalty
ecosystem. **Mistris / Contractors** refer customers to the shop and earn commission
points; the **shop owner / admin** records sales and manages the whole program.

Built with **React + Vite + Tailwind CSS v4 + Firebase (Auth phone-OTP + Firestore) +
Recharts**.

> 💡 **Runs out of the box in DEMO MODE** (localStorage, no Firebase needed). Add your
> Firebase keys to `.env` to switch to real phone-OTP login + cloud database.

---

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
```

### Demo logins (no Firebase required)
On the login screen:
- **OTP flow** — enter any 10-digit number, use OTP **`123456`**.
- **Quick login buttons** — one tap as a Mistri (Ramesh) or as the Admin (Shop Owner).

The demo is pre-seeded with users, sales, gifts, dues and notifications so every screen
has realistic data. Data persists in your browser's `localStorage`
(key `mistri_rewards_db_v1`).

---

## Features

### 👷 User App (Mistri / Contractor) — `/app`
| Feature | Where |
|---|---|
| Mobile-number login with OTP | `/login` |
| Profile management (name, trade, city) | Profile tab |
| Auto-generated Referral ID + share | Home dashboard |
| Wallet / commission point tracking | Wallet tab |
| Sales history (points earned + redemptions) | Wallet tab |
| Gift catalog & redemption | Gifts tab |
| Leaderboard (podium + your rank) | Ranks tab |
| Referral performance dashboard (6-month chart) | Home |
| Push-style notifications | Bell icon |

### 🛠️ Admin Panel — `/admin`
| Feature | Where |
|---|---|
| Dashboard & analytics (sales trend, top contributors) | Dashboard |
| **Record Sale** — enter Referral ID + Commission Points | Record Sale |
| Commission management (full sales ledger) | Commissions |
| Buyer **due management** (track / settle outstanding payments) | Buyer Dues |
| User management (search + adjust points) | Users |
| Gift management (CRUD + approve redemptions) | Gifts & Rewards |
| Notification management (broadcast / target) | Notifications |

### How the loyalty loop works
1. Mistri registers → gets a unique **Referral ID** (e.g. `MR-RAM01`).
2. Mistri brings a customer to the shop.
3. Shop owner opens **Record Sale**, enters the Referral ID + sale amount + commission
   points → points are auto-credited to the Mistri's wallet.
4. Mistri tracks referrals, sales, points, climbs the **leaderboard**, and redeems **gifts**.

---

## Connecting real Firebase

1. Create a project at <https://console.firebase.google.com>.
2. **Authentication → Sign-in method → Phone**: enable it. (Add test numbers there for
   development without spending SMS quota.)
3. **Firestore Database**: create it (start in test mode, then add the rules below).
4. **Project settings → General → Your apps → Web app**: copy the config.
5. `cp .env.example .env` and fill in the values. Set `VITE_ADMIN_PHONES` to your admin
   number(s) in E.164 format (`+9198...`). Restart `npm run dev`.

The app detects the keys and automatically uses real Firebase instead of demo mode.

### Firestore collections
`users`, `sales`, `gifts`, `redemptions`, `dues`, `notifications` — created on first
write. The shapes match the seed data in [`src/services/mockStore.js`](src/services/mockStore.js).

### Suggested security rules (starting point)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    function isAdmin() {
      return request.auth != null &&
        get(/databases/$(db)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid || isAdmin();
    }
    match /sales/{id}   { allow read: if request.auth != null; allow write: if isAdmin(); }
    match /dues/{id}    { allow read, write: if isAdmin(); }
    match /gifts/{id}   { allow read: if request.auth != null; allow write: if isAdmin(); }
    match /redemptions/{id} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if isAdmin();
    }
    match /notifications/{id} { allow read: if request.auth != null; allow write: if isAdmin(); }
  }
}
```
> ⚠️ The included rules are a starting point. Promote the first admin manually (set
> `role: "admin"` on their `users` doc) or use the `VITE_ADMIN_PHONES` allow-list.

### Push notifications (optional)
The Notifications page writes to Firestore. To deliver real device pushes, enable
**Cloud Messaging**, add a service worker (`firebase-messaging-sw.js`), request a token
with the `VITE_FIREBASE_VAPID_KEY`, and trigger sends from a Cloud Function on new
`notifications` documents.

---

## Project structure
```
src/
├── firebase/config.js        # Firebase init + demo-mode detection
├── services/
│   ├── db.js                 # Unified data API (Firestore OR demo) — same signatures
│   └── mockStore.js          # localStorage demo store + seed data
├── context/AuthContext.jsx   # Phone OTP, demo login, session, profile
├── routes/ProtectedRoute.jsx # Auth + admin-only guards
├── components/
│   ├── ui/index.jsx          # StatCard, Modal, Badge, Avatar, loaders…
│   └── layout/               # UserLayout (bottom-nav/side-rail), AdminLayout (sidebar)
├── pages/
│   ├── Login.jsx
│   ├── user/                 # Dashboard, Wallet, Gifts, Leaderboard, Profile, Notifications
│   └── admin/                # Dashboard, RecordSale, Users, Commissions, BuyerDues, Gifts, Notifications
└── App.jsx                   # Routes
```

## Responsiveness
Mobile-first. The user app uses a bottom tab bar ≤ `lg` and a left side-rail on desktop;
the admin panel uses a drawer on mobile and a fixed sidebar on desktop. Tested fluidly
from **320px to 1980px**.

## Scripts
| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |

To reset demo data: clear site data / `localStorage`, or run
`localStorage.removeItem('mistri_rewards_db_v1')` in the browser console.
