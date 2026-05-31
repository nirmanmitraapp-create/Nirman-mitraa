import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Wallet, Gift, Trophy, User, LogOut, Bell } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { subscribeNotificationsForUser } from '../../services/db'
import { initMessagingForUser } from '../../firebase/messaging'
import { Avatar } from '../ui/index.jsx'

const nav = [
  { to: '/app', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/app/wallet', label: 'Wallet', icon: Wallet },
  { to: '/app/gifts', label: 'Gifts', icon: Gift },
  { to: '/app/leaderboard', label: 'Ranks', icon: Trophy },
  { to: '/app/profile', label: 'Profile', icon: User },
]

const SEEN_KEY = 'mistri_notif_seen_at'

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const gain = ctx.createGain()
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    // Two-note chime: A5 → C#6
    const notes = [880, 1109]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15)
      osc.connect(gain)
      osc.start(ctx.currentTime + i * 0.15)
      osc.stop(ctx.currentTime + i * 0.15 + 0.3)
    })
  } catch { /* AudioContext not supported or blocked */ }
}

export default function UserLayout() {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)
  const [toast, setToast] = useState(null)
  const knownIds = useRef(null) // Set of notification ids seen so far

  // Register for push (permission + FCM token) once we know the user.
  useEffect(() => {
    if (profile?.id) initMessagingForUser(profile.id)
  }, [profile?.id])

  // Live notifications: badge + browser notification + in-app toast on new ones.
  useEffect(() => {
    if (!profile?.id) return
    let unsub = () => {}
    const lastSeen = Number(localStorage.getItem(SEEN_KEY) || 0)

    subscribeNotificationsForUser(profile.id, (items) => {
      // first snapshot = baseline; just count unread since lastSeen
      if (knownIds.current === null) {
        knownIds.current = new Set(items.map((n) => n.id))
        setUnread(items.filter((n) => n.createdAt > lastSeen).length)
        return
      }
      const fresh = items.filter((n) => !knownIds.current.has(n.id))
      fresh.forEach((n) => {
        knownIds.current.add(n.id)
        setUnread((u) => u + 1)
        setToast({ title: n.title, body: n.body })
        playNotificationSound()
      })
      if (fresh.length) setTimeout(() => setToast(null), 6000)
    }).then((fn) => { unsub = fn })

    return () => unsub()
  }, [profile?.id])

  const openNotifications = () => {
    localStorage.setItem(SEEN_KEY, String(Date.now()))
    setUnread(0)
    navigate('/app/notifications')
  }

  const onLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      {/* Desktop side rail */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 lg:flex">
        <Brand />
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <n.icon className="h-5 w-5" />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <button onClick={onLogout} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50">
          <LogOut className="h-5 w-5" /> Logout
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
          <div className="lg:hidden">
            <Brand small />
          </div>
          <div className="hidden lg:block">
            <p className="text-sm text-slate-500">Welcome back,</p>
            <p className="font-semibold text-slate-900">{profile?.name || 'Mistri'}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={openNotifications} className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
            <NavLink to="/app/profile">
              <Avatar name={profile?.name} src={profile?.photoURL} size="h-9 w-9" />
            </NavLink>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5 pb-24 sm:px-6 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition ${
                isActive ? 'text-brand-700' : 'text-slate-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <n.icon className={`h-5 w-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                {n.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* In-app notification toast */}
      {toast && (
        <button
          onClick={openNotifications}
          className="fixed inset-x-4 top-4 z-50 mx-auto flex max-w-sm items-start gap-3 rounded-2xl bg-white p-4 text-left shadow-xl ring-1 ring-slate-200 animate-[slideDown_.25s_ease-out] lg:left-auto lg:right-6 lg:mx-0"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
            <Bell className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{toast.title}</p>
            <p className="line-clamp-2 text-sm text-slate-500">{toast.body}</p>
          </div>
          <style>{`@keyframes slideDown{from{transform:translateY(-16px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
        </button>
      )}
    </div>
  )
}

function Brand({ small }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-700 text-lg">🏗️</span>
      {!small && (
        <div>
          <p className="font-extrabold leading-tight text-slate-900">Mistri Rewards</p>
          <p className="text-[11px] text-slate-400">Loyalty Program</p>
        </div>
      )}
      {small && <p className="font-extrabold text-slate-900">Mistri Rewards</p>}
    </div>
  )
}
