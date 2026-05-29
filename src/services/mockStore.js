// ----------------------------------------------------------------------------
// Demo-mode data store (localStorage)
// ----------------------------------------------------------------------------
// A tiny synchronous store that mimics the shape of our Firestore collections
// so the entire app is fully usable without any Firebase setup.
// ----------------------------------------------------------------------------

const KEY = 'mistri_rewards_db_v1'

const uid = (prefix = 'id') =>
  `${prefix}_${Math.random().toString(36).slice(2, 9)}${(performance.now() | 0).toString(36)}`

export const makeReferralId = () =>
  'MR-' + Math.random().toString(36).slice(2, 7).toUpperCase()

function seed() {
  const now = Date.now()
  const day = 86400000

  const users = [
    {
      id: 'u_ramesh', uid: 'u_ramesh', name: 'Ramesh Kumar', email: 'ramesh@demo.com', password: 'demo123', phone: '+919812345670',
      role: 'user', trade: 'Mason', city: 'Indore', referralId: 'MR-RAM01',
      points: 1850, totalEarned: 4200, photoURL: '', createdAt: now - 40 * day,
    },
    {
      id: 'u_suresh', uid: 'u_suresh', name: 'Suresh Verma', email: 'suresh@demo.com', password: 'demo123', phone: '+919812345671',
      role: 'user', trade: 'Contractor', city: 'Bhopal', referralId: 'MR-SUR02',
      points: 3120, totalEarned: 6800, photoURL: '', createdAt: now - 60 * day,
    },
    {
      id: 'u_mahesh', uid: 'u_mahesh', name: 'Mahesh Patel', email: 'mahesh@demo.com', password: 'demo123', phone: '+919812345672',
      role: 'user', trade: 'Plumber', city: 'Indore', referralId: 'MR-MAH03',
      points: 640, totalEarned: 1500, photoURL: '', createdAt: now - 20 * day,
    },
    {
      id: 'u_dinesh', uid: 'u_dinesh', name: 'Dinesh Yadav', email: 'dinesh@demo.com', password: 'demo123', phone: '+919812345673',
      role: 'user', trade: 'Electrician', city: 'Ujjain', referralId: 'MR-DIN04',
      points: 2240, totalEarned: 5100, photoURL: '', createdAt: now - 75 * day,
    },
    {
      id: 'u_admin', uid: 'u_admin', name: 'Shop Owner', email: 'owner@shop.com', password: 'admin123', phone: '+919999999999',
      role: 'admin', trade: '', city: 'Indore', referralId: 'MR-ADMIN',
      points: 0, totalEarned: 0, photoURL: '', createdAt: now - 90 * day,
    },
  ]

  const sales = [
    { id: uid('s'), referralId: 'MR-RAM01', userId: 'u_ramesh', customerName: 'Anil Sharma', customerPhone: '+919800000001', amount: 24000, commissionPoints: 480, material: 'Cement (50 bags)', note: '', recordedBy: 'Shop Owner', createdAt: now - 2 * day },
    { id: uid('s'), referralId: 'MR-SUR02', userId: 'u_suresh', customerName: 'Building Co.', customerPhone: '+919800000002', amount: 86000, commissionPoints: 1720, material: 'Steel TMT bars', note: 'Bulk order', recordedBy: 'Shop Owner', createdAt: now - 5 * day },
    { id: uid('s'), referralId: 'MR-RAM01', userId: 'u_ramesh', customerName: 'Vikas Jain', customerPhone: '+919800000003', amount: 12500, commissionPoints: 250, material: 'Bricks', note: '', recordedBy: 'Shop Owner', createdAt: now - 8 * day },
    { id: uid('s'), referralId: 'MR-DIN04', userId: 'u_dinesh', customerName: 'Rakesh', customerPhone: '+919800000004', amount: 31000, commissionPoints: 620, material: 'Wiring + fittings', note: '', recordedBy: 'Shop Owner', createdAt: now - 12 * day },
    { id: uid('s'), referralId: 'MR-MAH03', userId: 'u_mahesh', customerName: 'Sunita Devi', customerPhone: '+919800000005', amount: 9000, commissionPoints: 180, material: 'Pipes & taps', note: '', recordedBy: 'Shop Owner', createdAt: now - 15 * day },
    { id: uid('s'), referralId: 'MR-SUR02', userId: 'u_suresh', customerName: 'Metro Builders', customerPhone: '+919800000006', amount: 54000, commissionPoints: 1080, material: 'Cement + sand', note: '', recordedBy: 'Shop Owner', createdAt: now - 22 * day },
  ]

  const gifts = [
    { id: uid('g'), title: 'Steel Water Bottle', description: 'Premium insulated bottle', pointsCost: 500, image: '🥤', stock: 50, active: true },
    { id: uid('g'), title: 'Branded T-Shirt', description: 'Cotton work t-shirt', pointsCost: 800, image: '👕', stock: 40, active: true },
    { id: uid('g'), title: 'Tool Kit', description: '12-piece hand tool set', pointsCost: 2000, image: '🧰', stock: 15, active: true },
    { id: uid('g'), title: 'Smartphone', description: 'Entry-level Android phone', pointsCost: 12000, image: '📱', stock: 5, active: true },
    { id: uid('g'), title: 'Helmet + Safety Kit', description: 'Site safety essentials', pointsCost: 1200, image: '⛑️', stock: 20, active: true },
  ]

  const redemptions = [
    { id: uid('r'), userId: 'u_ramesh', giftId: gifts[0].id, giftTitle: 'Steel Water Bottle', pointsCost: 500, status: 'delivered', createdAt: now - 10 * day },
    { id: uid('r'), userId: 'u_dinesh', giftId: gifts[1].id, giftTitle: 'Branded T-Shirt', pointsCost: 800, status: 'pending', createdAt: now - 1 * day },
  ]

  const dues = [
    { id: uid('d'), customerName: 'Anil Sharma', customerPhone: '+919800000001', referralId: 'MR-RAM01', amount: 24000, paid: 14000, note: 'Partial payment', status: 'pending', createdAt: now - 2 * day },
    { id: uid('d'), customerName: 'Metro Builders', customerPhone: '+919800000006', referralId: 'MR-SUR02', amount: 54000, paid: 54000, note: '', status: 'cleared', createdAt: now - 22 * day },
    { id: uid('d'), customerName: 'Rakesh', customerPhone: '+919800000004', referralId: 'MR-DIN04', amount: 31000, paid: 10000, note: 'Balance due', status: 'pending', createdAt: now - 12 * day },
  ]

  const notifications = [
    { id: uid('n'), title: 'Welcome to Mistri Rewards! 🎉', body: 'Refer customers and earn points on every purchase.', audience: 'all', targetUserId: null, createdAt: now - 30 * day },
    { id: uid('n'), title: 'Diwali Bonus', body: 'Double points on cement purchases this week!', audience: 'all', targetUserId: null, createdAt: now - 3 * day },
  ]

  return { users, sales, gifts, redemptions, dues, notifications }
}

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  const fresh = seed()
  localStorage.setItem(KEY, JSON.stringify(fresh))
  return fresh
}

function write(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
  return data
}

export const mock = {
  uid,
  reset() {
    localStorage.removeItem(KEY)
    return read()
  },
  all() {
    return read()
  },
  get(collection) {
    return read()[collection] || []
  },
  set(collection, items) {
    const data = read()
    data[collection] = items
    return write(data)
  },
  add(collection, item) {
    const data = read()
    const record = { id: uid(collection[0]), ...item }
    data[collection] = [record, ...(data[collection] || [])]
    write(data)
    return record
  },
  update(collection, id, patch) {
    const data = read()
    data[collection] = (data[collection] || []).map((x) =>
      x.id === id ? { ...x, ...patch } : x,
    )
    write(data)
    return data[collection].find((x) => x.id === id)
  },
  remove(collection, id) {
    const data = read()
    data[collection] = (data[collection] || []).filter((x) => x.id !== id)
    write(data)
  },
}
