import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Save, User, Phone, Lock, Eye, EyeOff,
  Trash2, AlertTriangle, MapPin, Briefcase, Coins, Shield,
  KeyRound, Star, TrendingUp, TrendingDown, BadgeCheck,
} from 'lucide-react'
import { getUserByUid, updateUser, adminChangePassword, deleteUser } from '../../services/db'
import { Avatar, PageLoader, Spinner } from '../../components/ui/index.jsx'
import { num } from '../../utils/format'

const TRADES = ['Mason', 'Plumber', 'Electrician', 'Contractor', 'Painter', 'Carpenter', 'Other']

export default function EditUser() {
  const { userId } = useParams()
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const [name, setName]     = useState('')
  const [phone, setPhone]   = useState('')
  const [trade, setTrade]   = useState('Mason')
  const [city, setCity]     = useState('')
  const [pointsDelta, setPointsDelta] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [showStored, setShowStored] = useState(false)
  const [showNew, setShowNew]       = useState(false)

  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState('')

  const [deleteStep, setDeleteStep] = useState(0)
  const [deleteBusy, setDeleteBusy] = useState(false)

  useEffect(() => {
    getUserByUid(userId)
      .then((u) => {
        if (!u) return navigate('/admin/users', { replace: true })
        setUser(u)
        setName(u.name || '')
        setPhone(u.phone || '')
        setTrade(u.trade || 'Mason')
        setCity(u.city || '')
      })
      .finally(() => setLoading(false))
  }, [userId, navigate])

  if (loading) return <PageLoader />
  if (!user)   return null

  const delta     = Number(pointsDelta) || 0
  const newPoints = Math.max(0, (user.points || 0) + delta)

  const saveAll = async () => {
    setErr('')
    if (!name.trim()) return setErr('Full name cannot be empty.')
    if (newPwd && newPwd.length < 6) return setErr('New password must be at least 6 characters.')

    setSaving(true)
    try {
      await updateUser(user.id, {
        name: name.trim(),
        phone: phone.trim(),
        trade,
        city: city.trim(),
      })

      if (delta !== 0) {
        const earned = delta > 0
          ? (user.totalEarned || 0) + delta
          : user.totalEarned
        await updateUser(user.id, { points: newPoints, totalEarned: earned })
      }

      if (newPwd) {
        const stored = user.plainPassword || user.password || ''
        await adminChangePassword(user.id, user.email, stored, newPwd)
      }

      navigate('/admin/users')
    } catch (e) {
      setErr(e.message || 'Failed to save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const submitDelete = async () => {
    setDeleteBusy(true)
    try {
      await deleteUser(user.id)
      navigate('/admin/users', { replace: true })
    } catch (e) {
      setErr(e.message || 'Failed to delete user.')
      setDeleteStep(0)
      setDeleteBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">

      {/* ── Back nav ── */}
      <button
        onClick={() => navigate('/admin/users')}
        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition"
      >
        <ChevronLeft className="h-4 w-4" /> Back to Users
      </button>

      {/* ── User Hero Card ── */}
      <div className="card overflow-hidden">
        <div className="h-24 bg-linear-to-br from-[#1a2744] via-brand-600 to-brand-500" />
        <div className="px-5 pb-5">
          <div className="-mt-8 mb-3">
            <div className="ring-4 ring-white rounded-full shadow-sm inline-block">
              <Avatar name={user.name} src={user.photoURL} size="h-16 w-16" />
            </div>
          </div>

          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">{user.name}</h1>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              <Star className="h-3 w-3" /> {num(user.points)} pts
            </span>
            {user.trade && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
                <Briefcase className="h-3 w-3" /> {user.trade}
              </span>
            )}
            {user.city && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                <MapPin className="h-3 w-3" /> {user.city}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Profile Info ── */}
      <div className="card p-5 space-y-4">
        <SectionTitle icon={User} color="brand">Profile Info</SectionTitle>

        <div>
          <label className="label">Full Name</label>
          <FieldWrap icon={User}>
            <input
              className="w-full bg-transparent py-2.5 text-sm outline-none"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FieldWrap>
        </div>

        <div>
          <label className="label">Phone Number</label>
          <FieldWrap icon={Phone}>
            <input
              type="tel"
              className="w-full bg-transparent py-2.5 text-sm outline-none"
              placeholder="10-digit mobile"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </FieldWrap>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Trade</label>
            <div className="relative">
              <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                className="input pl-9"
                value={trade}
                onChange={(e) => setTrade(e.target.value)}
              >
                {TRADES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">City</label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-9"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Points ── */}
      <div className="card p-5 space-y-4">
        <SectionTitle icon={Coins} color="amber">Points</SectionTitle>

        <div className="flex items-center justify-between rounded-xl border border-amber-100 bg-linear-to-r from-amber-50 to-yellow-50 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-100">
              <Star className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Current Balance</p>
              <p className="text-base font-bold text-slate-900">
                {num(user.points)} <span className="text-amber-600 font-semibold">pts</span>
              </p>
            </div>
          </div>
          {user.totalEarned > 0 && (
            <div className="text-right">
              <p className="text-xs text-slate-400">Total earned</p>
              <p className="text-sm font-semibold text-slate-600">{num(user.totalEarned)} pts</p>
            </div>
          )}
        </div>

        <div>
          <label className="label">
            Adjustment
            <span className="ml-1.5 text-xs font-normal text-slate-400">positive = add · negative = deduct</span>
          </label>
          <FieldWrap icon={delta < 0 ? TrendingDown : TrendingUp} iconColorClass={delta < 0 ? 'text-rose-400' : delta > 0 ? 'text-emerald-500' : 'text-slate-400'}>
            <input
              type="number"
              className="w-full bg-transparent py-2.5 text-sm outline-none"
              placeholder="e.g. +500 or -200  (leave blank for no change)"
              value={pointsDelta}
              onChange={(e) => setPointsDelta(e.target.value)}
            />
          </FieldWrap>
          {delta !== 0 && (
            <div className={`mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
              delta > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
            }`}>
              {delta > 0 ? <TrendingUp className="h-3.5 w-3.5 shrink-0" /> : <TrendingDown className="h-3.5 w-3.5 shrink-0" />}
              Balance after save: <b className="ml-0.5">{num(newPoints)} pts</b>
              <span className="ml-auto opacity-70">({delta > 0 ? '+' : ''}{num(delta)})</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Security ── */}
      <div className="card p-5 space-y-4">
        <SectionTitle icon={Shield} color="blue">Security</SectionTitle>

        <div>
          <label className="label">Stored Password</label>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <KeyRound className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="flex-1 font-mono text-sm tracking-wider text-slate-700">
              {showStored
                ? (user.plainPassword || user.password || '—')
                : '•'.repeat(Math.max(8, (user.plainPassword || user.password || '').length))}
            </span>
            <button
              type="button"
              onClick={() => setShowStored((s) => !s)}
              className="rounded-md p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
            >
              {showStored ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {!user.plainPassword && !user.password && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
              <BadgeCheck className="h-3.5 w-3.5 text-brand-500" />
              Google sign-in or pre-existing account — no stored password.
            </p>
          )}
        </div>

        <div className="border-t border-slate-100 pt-4">
          <label className="label">
            Set New Password
            <span className="ml-1.5 text-xs font-normal text-slate-400">(leave blank to keep current)</span>
          </label>
          <FieldWrap icon={Lock}>
            <input
              type={showNew ? 'text' : 'password'}
              className="w-full bg-transparent py-2.5 text-sm outline-none"
              placeholder="Min 6 characters"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowNew((s) => !s)}
              className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </FieldWrap>
        </div>
      </div>

      {/* ── Error ── */}
      {err && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          {err}
        </div>
      )}

      {/* ── Action Buttons ── */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/admin/users')}
          className="btn-ghost w-full"
          disabled={saving}
        >
          Cancel
        </button>
        <button
          onClick={saveAll}
          disabled={saving}
          className="btn-primary w-full"
        >
          {saving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          Save All Changes
        </button>
      </div>

      {/* ── Danger Zone ── */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-rose-100 bg-rose-50 px-5 py-3">
          <AlertTriangle className="h-4 w-4 text-rose-500" />
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Danger Zone</p>
        </div>

        <div className="p-5">
          {deleteStep === 0 && (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-800">Delete this account</p>
                <p className="mt-0.5 text-xs text-slate-400">Permanently removes the user and all their data.</p>
              </div>
              <button
                onClick={() => setDeleteStep(1)}
                className="flex shrink-0 items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          )}

          {deleteStep === 1 && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                <div>
                  <p className="text-sm font-semibold text-rose-800">Delete "{user.name}"?</p>
                  <p className="mt-0.5 text-xs text-rose-600">
                    This will permanently remove this account and all related data.
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={() => setDeleteStep(0)} className="btn-ghost text-sm">
                  Cancel
                </button>
                <button
                  onClick={() => setDeleteStep(2)}
                  className="rounded-xl bg-rose-600 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          )}

          {deleteStep === 2 && (
            <div className="rounded-xl border-2 border-rose-500 bg-rose-50 p-5 text-center">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-rose-100">
                <Trash2 className="h-6 w-6 text-rose-600" />
              </div>
              <p className="font-bold text-rose-900">Are you absolutely sure?</p>
              <p className="mt-1.5 text-xs text-rose-700 leading-relaxed">
                This will permanently delete <span className="font-semibold">{user.name}</span>'s account
                and all related data. <span className="font-semibold">This cannot be undone.</span>
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={submitDelete}
                  disabled={deleteBusy}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-700 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:opacity-60"
                >
                  {deleteBusy ? <Spinner className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                  Yes, Permanently Delete
                </button>
                <button onClick={() => setDeleteStep(0)} className="btn-ghost w-full text-sm">
                  No, Keep Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="h-4" />
    </div>
  )
}

function SectionTitle({ icon: Icon, children, color = 'brand' }) {
  const colors = {
    brand: 'bg-brand-50 text-brand-700',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    rose: 'bg-rose-50 text-rose-600',
  }
  return (
    <div className="flex items-center gap-2.5">
      {Icon && (
        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${colors[color]}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      )}
      <p className="text-sm font-semibold text-slate-700">{children}</p>
    </div>
  )
}

function FieldWrap({ icon: Icon, iconColorClass = 'text-slate-400', children }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/30">
      <Icon className={`h-4 w-4 shrink-0 ${iconColorClass}`} />
      {children}
    </div>
  )
}
