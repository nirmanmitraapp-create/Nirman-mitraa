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

  const onLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-slate-900 px-4 py-6 lg:flex">
        <div className="flex items-center gap-2 px-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-700 text-lg">🏗️</span>
          <div>
            <p className="font-extrabold leading-tight text-white">Admin Panel</p>
            <p className="text-[11px] text-slate-400">Mistri Rewards</p>
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
                  isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <n.icon className="h-5 w-5" />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <button onClick={onLogout} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-300 hover:bg-slate-800">
          <LogOut className="h-5 w-5" /> Logout
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-700 text-base lg:hidden">🏗️</span>
            <h1 className="font-bold text-slate-900">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:block">{profile?.name}</span>
            <Avatar name={profile?.name} src={profile?.photoURL} size="h-9 w-9" />
            <button onClick={onLogout} className="hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-rose-500 hover:bg-rose-50 sm:flex lg:hidden">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </header>

        {/* Page content — extra bottom padding on mobile for the tab bar */}
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
