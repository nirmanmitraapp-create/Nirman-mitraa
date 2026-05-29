import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, ReceiptIndianRupee, Coins, Wallet2,
  Gift, Bell, LogOut, Menu, X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Avatar } from '../ui/index.jsx'

const nav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/record-sale', label: 'Record Sale', icon: ReceiptIndianRupee },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/commissions', label: 'Commissions', icon: Coins },
  { to: '/admin/dues', label: 'Buyer Dues', icon: Wallet2 },
  { to: '/admin/gifts', label: 'Gifts & Rewards', icon: Gift },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell },
]

export default function AdminLayout() {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const onLogout = async () => {
    await logout()
    navigate('/login')
  }

  const SidebarContent = (
    <>
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
            onClick={() => setOpen(false)}
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
    </>
  )

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-slate-900 px-4 py-6 lg:flex">
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-slate-900 px-4 py-6">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-3 rounded-lg p-1 text-slate-400 hover:bg-slate-800">
              <X className="h-5 w-5" />
            </button>
            {SidebarContent}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-bold text-slate-900">Admin</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:block">{profile?.name}</span>
            <Avatar name={profile?.name} src={profile?.photoURL} size="h-9 w-9" />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
