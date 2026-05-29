// ----------------------------------------------------------------------------
// Unified data API
// ----------------------------------------------------------------------------
// Every function returns a Promise and has the SAME signature whether the app
// is talking to Firestore (real) or the localStorage mock (demo). UI code never
// needs to know which mode it is in.
// ----------------------------------------------------------------------------
import { isFirebaseConfigured, db } from '../firebase/config'
import { mock, makeReferralId } from './mockStore'

let fs = null
async function firestore() {
  if (!fs) fs = await import('firebase/firestore')
  return fs
}

export { makeReferralId }

/* =========================================================================
   USERS
========================================================================= */
export async function getUserByUid(uidValue) {
  if (!isFirebaseConfigured) return mock.get('users').find((u) => u.uid === uidValue) || null
  const { doc, getDoc } = await firestore()
  const snap = await getDoc(doc(db, 'users', uidValue))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function getUserByEmail(email) {
  const target = String(email || '').toLowerCase()
  if (!isFirebaseConfigured)
    return mock.get('users').find((u) => (u.email || '').toLowerCase() === target) || null
  const { collection, query, where, getDocs } = await firestore()
  const q = query(collection(db, 'users'), where('email', '==', target))
  const snap = await getDocs(q)
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() }
}

export async function createUser(uidValue, data) {
  const record = {
    uid: uidValue,
    name: data.name || 'New User',
    email: (data.email || '').toLowerCase(),
    phone: data.phone || '',
    role: data.role || 'user',
    trade: data.trade || 'Mason',
    city: data.city || '',
    referralId: data.referralId || makeReferralId(),
    points: 0,
    totalEarned: 0,
    photoURL: data.photoURL || '',
    createdAt: Date.now(),
  }
  // demo only: keep the password so we can validate logins locally
  if (!isFirebaseConfigured && data.password) record.password = data.password
  if (!isFirebaseConfigured) {
    const existing = mock.get('users').find((u) => u.uid === uidValue)
    if (existing) return existing
    return mock.set('users', [{ id: uidValue, ...record }, ...mock.get('users')]) && { id: uidValue, ...record }
  }
  const { doc, setDoc } = await firestore()
  await setDoc(doc(db, 'users', uidValue), record, { merge: true })
  return { id: uidValue, ...record }
}

export async function updateUser(id, patch) {
  if (!isFirebaseConfigured) return mock.update('users', id, patch)
  const { doc, updateDoc } = await firestore()
  await updateDoc(doc(db, 'users', id), patch)
  return { id, ...patch }
}

export async function listUsers() {
  if (!isFirebaseConfigured)
    return [...mock.get('users')].sort((a, b) => b.createdAt - a.createdAt)
  const { collection, getDocs, orderBy, query } = await firestore()
  const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/* =========================================================================
   SALES
========================================================================= */
export async function recordSale(sale) {
  const points = Number(sale.commissionPoints) || 0
  // attach the referring user, if found
  let user = null
  if (sale.referralId) {
    const users = await listUsers()
    user = users.find((u) => u.referralId?.toUpperCase() === sale.referralId.toUpperCase())
  }
  const record = {
    referralId: sale.referralId || '',
    userId: user?.id || null,
    customerName: sale.customerName || '',
    customerPhone: sale.customerPhone || '',
    amount: Number(sale.amount) || 0,
    commissionPoints: points,
    material: sale.material || '',
    note: sale.note || '',
    recordedBy: sale.recordedBy || 'Admin',
    createdAt: Date.now(),
  }

  if (!isFirebaseConfigured) {
    const created = mock.add('sales', record)
    if (user) {
      mock.update('users', user.id, {
        points: (user.points || 0) + points,
        totalEarned: (user.totalEarned || 0) + points,
      })
    }
    return created
  }

  const { collection, addDoc, doc, updateDoc, increment } = await firestore()
  const ref = await addDoc(collection(db, 'sales'), record)
  if (user) {
    await updateDoc(doc(db, 'users', user.id), {
      points: increment(points),
      totalEarned: increment(points),
    })
  }
  return { id: ref.id, ...record }
}

export async function listSales() {
  if (!isFirebaseConfigured)
    return [...mock.get('sales')].sort((a, b) => b.createdAt - a.createdAt)
  const { collection, getDocs, orderBy, query } = await firestore()
  const snap = await getDocs(query(collection(db, 'sales'), orderBy('createdAt', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function listSalesByUser(userId, referralId) {
  const all = await listSales()
  return all.filter(
    (s) => s.userId === userId || (referralId && s.referralId?.toUpperCase() === referralId.toUpperCase()),
  )
}

/* =========================================================================
   GIFTS + REDEMPTIONS
========================================================================= */
export async function listGifts() {
  if (!isFirebaseConfigured) return mock.get('gifts')
  const { collection, getDocs } = await firestore()
  const snap = await getDocs(collection(db, 'gifts'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function addGift(gift) {
  const record = {
    title: gift.title || '',
    description: gift.description || '',
    pointsCost: Number(gift.pointsCost) || 0,
    image: gift.image || '🎁',
    stock: Number(gift.stock) || 0,
    active: gift.active !== false,
  }
  if (!isFirebaseConfigured) return mock.add('gifts', record)
  const { collection, addDoc } = await firestore()
  const ref = await addDoc(collection(db, 'gifts'), record)
  return { id: ref.id, ...record }
}

export async function updateGift(id, patch) {
  if (!isFirebaseConfigured) return mock.update('gifts', id, patch)
  const { doc, updateDoc } = await firestore()
  await updateDoc(doc(db, 'gifts', id), patch)
  return { id, ...patch }
}

export async function removeGift(id) {
  if (!isFirebaseConfigured) return mock.remove('gifts', id)
  const { doc, deleteDoc } = await firestore()
  await deleteDoc(doc(db, 'gifts', id))
}

export async function redeemGift(user, gift) {
  if ((user.points || 0) < gift.pointsCost) {
    throw new Error('Not enough points to redeem this gift.')
  }
  const record = {
    userId: user.id,
    giftId: gift.id,
    giftTitle: gift.title,
    pointsCost: gift.pointsCost,
    status: 'pending',
    createdAt: Date.now(),
  }
  if (!isFirebaseConfigured) {
    const created = mock.add('redemptions', record)
    mock.update('users', user.id, { points: (user.points || 0) - gift.pointsCost })
    return created
  }
  const { collection, addDoc, doc, updateDoc, increment } = await firestore()
  const ref = await addDoc(collection(db, 'redemptions'), record)
  await updateDoc(doc(db, 'users', user.id), { points: increment(-gift.pointsCost) })
  return { id: ref.id, ...record }
}

// Admin hands a gift to a user in person: deduct points, log delivery, drop stock.
export async function adminGiveGift(user, gift, by = 'Admin') {
  if ((user.points || 0) < gift.pointsCost) {
    throw new Error(`${user.name} has only ${user.points} pts — needs ${gift.pointsCost}.`)
  }
  const record = {
    userId: user.id,
    giftId: gift.id,
    giftTitle: gift.title,
    pointsCost: gift.pointsCost,
    status: 'delivered',
    givenBy: by,
    createdAt: Date.now(),
  }
  if (!isFirebaseConfigured) {
    const created = mock.add('redemptions', record)
    mock.update('users', user.id, { points: Math.max(0, (user.points || 0) - gift.pointsCost) })
    if (gift.stock > 0) mock.update('gifts', gift.id, { stock: gift.stock - 1 })
    return created
  }
  const { collection, addDoc, doc, updateDoc, increment } = await firestore()
  const ref = await addDoc(collection(db, 'redemptions'), record)
  await updateDoc(doc(db, 'users', user.id), { points: increment(-gift.pointsCost) })
  if (gift.stock > 0) await updateDoc(doc(db, 'gifts', gift.id), { stock: increment(-1) })
  return { id: ref.id, ...record }
}

export async function listRedemptions() {
  if (!isFirebaseConfigured)
    return [...mock.get('redemptions')].sort((a, b) => b.createdAt - a.createdAt)
  const { collection, getDocs, orderBy, query } = await firestore()
  const snap = await getDocs(query(collection(db, 'redemptions'), orderBy('createdAt', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function listRedemptionsByUser(userId) {
  return (await listRedemptions()).filter((r) => r.userId === userId)
}

export async function updateRedemption(id, patch) {
  // if rejected, refund points
  if (patch.status === 'rejected') {
    const red = (await listRedemptions()).find((r) => r.id === id)
    if (red) {
      const users = await listUsers()
      const u = users.find((x) => x.id === red.userId)
      if (u) await updateUser(u.id, { points: (u.points || 0) + red.pointsCost })
    }
  }
  if (!isFirebaseConfigured) return mock.update('redemptions', id, patch)
  const { doc, updateDoc } = await firestore()
  await updateDoc(doc(db, 'redemptions', id), patch)
  return { id, ...patch }
}

/* =========================================================================
   BUYER DUES
========================================================================= */
export async function listDues() {
  if (!isFirebaseConfigured)
    return [...mock.get('dues')].sort((a, b) => b.createdAt - a.createdAt)
  const { collection, getDocs, orderBy, query } = await firestore()
  const snap = await getDocs(query(collection(db, 'dues'), orderBy('createdAt', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function addDue(due) {
  const amount = Number(due.amount) || 0
  const paid = Number(due.paid) || 0
  const record = {
    customerName: due.customerName || '',
    customerPhone: due.customerPhone || '',
    referralId: due.referralId || '',
    amount,
    paid,
    note: due.note || '',
    status: paid >= amount ? 'cleared' : 'pending',
    createdAt: Date.now(),
  }
  if (!isFirebaseConfigured) return mock.add('dues', record)
  const { collection, addDoc } = await firestore()
  const ref = await addDoc(collection(db, 'dues'), record)
  return { id: ref.id, ...record }
}

export async function updateDue(id, patch) {
  if (patch.amount != null || patch.paid != null) {
    const due = (await listDues()).find((d) => d.id === id)
    const amount = patch.amount != null ? Number(patch.amount) : due.amount
    const paid = patch.paid != null ? Number(patch.paid) : due.paid
    patch.status = paid >= amount ? 'cleared' : 'pending'
  }
  if (!isFirebaseConfigured) return mock.update('dues', id, patch)
  const { doc, updateDoc } = await firestore()
  await updateDoc(doc(db, 'dues', id), patch)
  return { id, ...patch }
}

export async function removeDue(id) {
  if (!isFirebaseConfigured) return mock.remove('dues', id)
  const { doc, deleteDoc } = await firestore()
  await deleteDoc(doc(db, 'dues', id))
}

/* =========================================================================
   NOTIFICATIONS
========================================================================= */
export async function listNotifications() {
  if (!isFirebaseConfigured)
    return [...mock.get('notifications')].sort((a, b) => b.createdAt - a.createdAt)
  const { collection, getDocs, orderBy, query } = await firestore()
  const snap = await getDocs(query(collection(db, 'notifications'), orderBy('createdAt', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function listNotificationsForUser(userId) {
  return (await listNotifications()).filter(
    (n) => n.audience === 'all' || n.targetUserId === userId,
  )
}

// Save a device's FCM token onto the user doc (for server-side push).
export async function addUserToken(userId, token) {
  if (!isFirebaseConfigured || !token) return
  const { doc, updateDoc, arrayUnion } = await firestore()
  await updateDoc(doc(db, 'users', userId), { fcmTokens: arrayUnion(token) })
}

// Live subscription to a user's notifications. Returns an unsubscribe function.
// Real Firebase uses onSnapshot; demo mode polls localStorage.
export async function subscribeNotificationsForUser(userId, cb) {
  if (!isFirebaseConfigured) {
    let stopped = false
    const tick = async () => { if (!stopped) cb(await listNotificationsForUser(userId)) }
    tick()
    const iv = setInterval(tick, 4000)
    return () => { stopped = true; clearInterval(iv) }
  }
  const { collection, onSnapshot, orderBy, query } = await firestore()
  const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => {
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    cb(all.filter((n) => n.audience === 'all' || n.targetUserId === userId))
  })
}

export async function addNotification(n) {
  const record = {
    title: n.title || '',
    body: n.body || '',
    audience: n.audience || 'all',
    targetUserId: n.targetUserId || null,
    createdAt: Date.now(),
  }
  if (!isFirebaseConfigured) return mock.add('notifications', record)
  const { collection, addDoc } = await firestore()
  const ref = await addDoc(collection(db, 'notifications'), record)
  return { id: ref.id, ...record }
}

export async function removeNotification(id) {
  if (!isFirebaseConfigured) return mock.remove('notifications', id)
  const { doc, deleteDoc } = await firestore()
  await deleteDoc(doc(db, 'notifications', id))
}

/* =========================================================================
   AGGREGATES
========================================================================= */
export async function getLeaderboard() {
  const users = (await listUsers()).filter((u) => u.role !== 'admin')
  const sales = await listSales()
  return users
    .map((u) => {
      const userSales = sales.filter(
        (s) => s.userId === u.id || s.referralId?.toUpperCase() === u.referralId?.toUpperCase(),
      )
      return {
        ...u,
        referralCount: new Set(userSales.map((s) => s.customerPhone || s.customerName)).size,
        salesTotal: userSales.reduce((sum, s) => sum + (s.amount || 0), 0),
        salesCount: userSales.length,
      }
    })
    .sort((a, b) => (b.totalEarned || 0) - (a.totalEarned || 0))
}

export async function getAdminStats() {
  const [users, sales, redemptions, dues] = await Promise.all([
    listUsers(),
    listSales(),
    listRedemptions(),
    listDues(),
  ])
  const mistris = users.filter((u) => u.role !== 'admin')
  const totalSales = sales.reduce((s, x) => s + (x.amount || 0), 0)
  const totalPoints = sales.reduce((s, x) => s + (x.commissionPoints || 0), 0)
  const outstandingDue = dues
    .filter((d) => d.status === 'pending')
    .reduce((s, d) => s + ((d.amount || 0) - (d.paid || 0)), 0)
  return {
    userCount: mistris.length,
    salesCount: sales.length,
    totalSales,
    totalPoints,
    pendingRedemptions: redemptions.filter((r) => r.status === 'pending').length,
    outstandingDue,
    sales,
    users: mistris,
  }
}
