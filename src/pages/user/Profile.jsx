import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Save, Phone, Mail, MapPin, Briefcase, BadgeCheck, ChevronRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Avatar, SectionHeader } from '../../components/ui/index.jsx'

const TRADES = ['Mason', 'Plumber', 'Electrician', 'Contractor', 'Painter', 'Carpenter', 'Other']

export default function Profile() {
  const { profile, isAdmin, saveProfile, logout } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: profile.name, trade: profile.trade, city: profile.city, phone: profile.phone || '' })
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const onSave = async () => {
    setBusy(true)
    await saveProfile(form)
    setBusy(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const onLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="space-y-5">
      <div className="card flex items-center gap-4 p-5">
        <Avatar name={profile.name} src={profile.photoURL} size="h-16 w-16" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-lg font-bold text-slate-900">{profile.name}</p>
            <BadgeCheck className="h-5 w-5 shrink-0 text-brand-600" />
          </div>
          <p className="text-sm text-slate-500">{profile.trade} · {profile.city || '—'}</p>
          <span className="chip mt-1 bg-brand-100 text-brand-700">ID: {profile.referralId}</span>
        </div>
      </div>

      {isAdmin && (
        <button onClick={() => navigate('/admin')} className="card flex w-full items-center justify-between p-4 text-left hover:bg-slate-50">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-white">🛠️</span>
            <div>
              <p className="font-semibold text-slate-900">Open Admin Panel</p>
              <p className="text-xs text-slate-500">Manage sales, users, gifts &amp; more</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400" />
        </button>
      )}

      <div className="card p-5">
        <SectionHeader title="Edit profile" />
        <label className="label">Full name</label>
        <input className="input" value={form.name} onChange={set('name')} />

        <label className="label mt-4 flex items-center gap-1"><Briefcase className="h-4 w-4" /> Trade</label>
        <select className="input" value={form.trade} onChange={set('trade')}>
          {TRADES.map((t) => <option key={t}>{t}</option>)}
        </select>

        <label className="label mt-4 flex items-center gap-1"><MapPin className="h-4 w-4" /> City</label>
        <input className="input" value={form.city} onChange={set('city')} />

        <label className="label mt-4 flex items-center gap-1"><Phone className="h-4 w-4" /> Mobile (optional)</label>
        <input className="input" value={form.phone} onChange={set('phone')} placeholder="Your contact number" inputMode="tel" />

        <label className="label mt-4 flex items-center gap-1"><Mail className="h-4 w-4" /> Email</label>
        <input className="input bg-slate-50 text-slate-400" value={profile.email || '—'} disabled />

        <button onClick={onSave} disabled={busy} className="btn-primary mt-5 w-full">
          <Save className="h-4 w-4" /> {busy ? 'Saving…' : saved ? 'Saved!' : 'Save changes'}
        </button>
      </div>

      <button onClick={onLogout} className="btn-danger w-full">
        <LogOut className="h-4 w-4" /> Logout
      </button>
    </div>
  )
}
