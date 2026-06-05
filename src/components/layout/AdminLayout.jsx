import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Coins,
  Gift, Bell, LogOut,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Avatar } from '../ui/index.jsx'

const nav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/commissions', label: 'Commissions', icon: Coins },
  { to: '/admin/gifts', label: 'Gifts', icon: Gift },
  { to: '/admin/notifications', label: 'Alerts', icon: Bell },
]

export default function AdminLayout() {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const onLogout = async () => {
    await logout()
    navigate('/login')
  }

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      {/* Desktop sidebar — dark navy from logo */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-[#1a2744] px-4 py-6 lg:flex">
        <div className="flex items-center gap-2.5 px-2">
          <img src="/logo.jpeg" alt="Nirman Mitra" className="h-10 w-10 rounded-xl object-cover ring-2 ring-white/20" />
          <div>
            <p className="font-extrabold leading-tight text-white">Admin Panel</p>
            <p className="text-[11px] text-brand-300">Nirman Mitra</p>
          </div>
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-500 text-white'
                    : 'text-slate-300 hover:bg-[#243660] hover:text-white'
                }`
              }
            >
              <n.icon className="h-5 w-5" />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <button onClick={onLogout} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-300 hover:bg-[#243660] hover:text-white transition">
          <LogOut className="h-5 w-5" /> Logout
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2.5">
            <img src="/logo.jpeg" alt="Nirman Mitra" className="h-8 w-8 rounded-xl object-cover lg:hidden" />
            <h1 className="font-bold text-slate-900">Admin Panel</h1>
          </div>
          <div className="relative flex items-center gap-3" ref={menuRef}>
            <span className="hidden text-sm text-slate-500 sm:block">{profile?.name}</span>
            <button
              onClick={() => setMenuOpen((s) => !s)}
              className="rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label="Profile menu"
            >
              <Avatar name={profile?.name} src={profile?.photoURL} size="h-9 w-9" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-12 z-50 min-w-44 rounded-2xl border border-slate-200 bg-white py-1 shadow-lg">
                <div className="border-b border-slate-100 px-4 py-2.5">
                  <p className="text-sm font-semibold text-slate-900">{profile?.name || 'Admin'}</p>
                  <p className="truncate text-xs text-slate-400">{profile?.email}</p>
                </div>
                <button
                  onClick={onLogout}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-rose-500 hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 pb-24 sm:px-6 lg:pb-5">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch border-t border-slate-200 bg-white lg:hidden">
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                isActive ? 'text-brand-600' : 'text-slate-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`grid h-9 w-9 place-items-center rounded-xl transition-colors ${isActive ? 'bg-brand-50' : ''}`}>
                  <n.icon className="h-5 w-5" />
                </span>
                {n.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
