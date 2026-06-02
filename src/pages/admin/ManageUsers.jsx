import { useEffect, useState } from 'react'
import {
  Search, Plus, Minus, UserPlus, Eye, EyeOff, Lock, KeyRound,
  Mail, Phone, User, X, Save,
} from 'lucide-react'
import { updateUser, getLeaderboard, adminCreateUser, adminChangePassword } from '../../services/db'
import {
  SectionHeader, PageLoader, Avatar, Modal, Badge, Pagination, usePaged, Spinner,
} from '../../components/ui/index.jsx'
import { num, inr, dateStr } from '../../utils/format'

const TRADES = ['Mason', 'Plumber', 'Electrician', 'Contractor', 'Painter', 'Carpenter', 'Other']

export default function ManageUsers() {
  const [rows, setRows] = useState(null)
  const [q, setQ] = useState('')

  // ---- edit drawer (profile + points + security) ----
  const [editUser, setEditUser] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', phone: '', trade: 'Mason', city: '' })
  const [profileBusy, setProfileBusy] = useState(false)
  const [profileErr, setProfileErr] = useState('')
  const [profileMsg, setProfileMsg] = useState('')
  const [delta, setDelta] = useState('')
  const [pointsBusy, setPointsBusy] = useState(false)
  const [showStoredPwd, setShowStoredPwd] = useState(false)
  const [newPwd, setNewPwd] = useState('')
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [pwdBusy, setPwdBusy] = useState(false)
  const [pwdErr, setPwdErr] = useState('')
  const [pwdMsg, setPwdMsg] = useState('')

  // ---- create user modal ----
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', email: '', phone: '', trade: 'Mason', city: '', password: '' })
  const [showCreatePwd, setShowCreatePwd] = useState(false)
  const [createBusy, setCreateBusy] = useState(false)
  const [createErr, setCreateErr] = useState('')

  const load = () => getLeaderboard().then(setRows)
  useEffect(() => { load() }, [])

  const filtered = (rows || []).filter(
    (u) =>
      u.name?.toLowerCase().includes(q.toLowerCase()) ||
      u.referralId?.toLowerCase().includes(q.toLowerCase()) ||
      u.phone?.includes(q),
  )
  const paged = usePaged(filtered, 10)

  if (!rows) return <PageLoader />

  // ---- edit drawer handlers ----
  const openEdit = (u) => {
    setEditUser(u)
    setEditForm({ name: u.name || '', phone: u.phone || '', trade: u.trade || 'Mason', city: u.city || '' })
    setProfileErr(''); setProfileMsg('')
    setDelta('')
    setNewPwd(''); setPwdErr(''); setPwdMsg('')
    setShowStoredPwd(false); setShowNewPwd(false)
  }

  const closeEdit = () => { setEditUser(null); load() }

  const saveProfile = async () => {
    setProfileErr(''); setProfileMsg('')
    if (!editForm.name.trim()) return setProfileErr('Name cannot be empty.')
    setProfileBusy(true)
    try {
      await updateUser(editUser.id, {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        trade: editForm.trade,
        city: editForm.city.trim(),
      })
      setProfileMsg('Profile updated successfully.')
      setEditUser((u) => ({ ...u, name: editForm.name.trim(), phone: editForm.phone.trim(), trade: editForm.trade, city: editForm.city.trim() }))
    } catch (err) {
      setProfileErr(err.message || 'Failed to update profile.')
    } finally {
      setProfileBusy(false)
    }
  }

  const adjustPoints = async (sign) => {
    const amt = sign * Math.abs(Number(delta) || 0)
    if (!amt) return
    setPointsBusy(true)
    try {
      const newPoints = Math.max(0, (editUser.points || 0) + amt)
      const newEarned = amt > 0 ? (editUser.totalEarned || 0) + amt : editUser.totalEarned
      await updateUser(editUser.id, { points: newPoints, totalEarned: newEarned })
      setEditUser((u) => ({ ...u, points: newPoints, totalEarned: newEarned }))
      setDelta('')
    } finally {
      setPointsBusy(false)
    }
  }

  const submitPwdChange = async () => {
    setPwdErr(''); setPwdMsg('')
    if (newPwd.length < 6) return setPwdErr('Password must be at least 6 characters.')
    setPwdBusy(true)
    try {
      const stored = editUser.plainPassword || editUser.password || ''
      await adminChangePassword(editUser.id, editUser.email, stored, newPwd)
      setPwdMsg('Password changed successfully.')
      setNewPwd('')
      setEditUser((u) => ({ ...u, plainPassword: newPwd }))
    } catch (err) {
      setPwdErr(err.message || 'Failed to change password.')
    } finally {
      setPwdBusy(false)
    }
  }

  // ---- create user handlers ----
  const setField = (k) => (e) => setCreateForm((f) => ({ ...f, [k]: e.target.value }))

  const openCreate = () => {
    setCreateForm({ name: '', email: '', phone: '', trade: 'Mason', city: '', password: '' })
    setCreateErr(''); setShowCreatePwd(false); setCreateOpen(true)
  }

  const submitCreate = async (e) => {
    e.preventDefault(); setCreateErr('')
    if (!createForm.name.trim()) return setCreateErr('Full name is required.')
    if (!/\S+@\S+\.\S+/.test(createForm.email)) return setCreateErr('Enter a valid email address.')
    if (createForm.password.length < 6) return setCreateErr('Password must be at least 6 characters.')
    setCreateBusy(true)
    try {
      await adminCreateUser(createForm)
      setCreateOpen(false); load()
    } catch (err) {
      setCreateErr(err.message || 'Failed to create account.')
    } finally {
      setCreateBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="User Management"
        subtitle={`${rows.length} registered Mistris & Contractors`}
        action={
          <button onClick={openCreate} className="btn-primary text-sm">
            <UserPlus className="h-4 w-4" /> Create User
          </button>
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <input className="input pl-9" placeholder="Search by name, referral ID, or phone…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 lg:hidden">
        {paged.pageItems.map((u) => (
          <div key={u.id} className="card p-4">
            <div className="flex items-center gap-3">
              <Avatar name={u.name} src={u.photoURL} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">{u.name}</p>
                <p className="truncate text-xs text-slate-500">{u.phone}</p>
              </div>
              <Badge tone="brand">{u.referralId}</Badge>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <Stat label="Points" value={num(u.points)} />
              <Stat label="Referrals" value={num(u.referralCount)} />
              <Stat label="Sales" value={inr(u.salesTotal)} />
            </div>
            <button onClick={() => openEdit(u)} className="btn-ghost mt-3 w-full text-xs">Edit User</button>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="card hidden overflow-x-auto lg:block">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Referral ID</th>
              <th className="px-4 py-3 font-medium">Trade</th>
              <th className="px-4 py-3 text-right font-medium">Referrals</th>
              <th className="px-4 py-3 text-right font-medium">Sales</th>
              <th className="px-4 py-3 text-right font-medium">Points</th>
              <th className="px-4 py-3 text-right font-medium">Joined</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paged.pageItems.map((u) => (
              <tr key={u.id} className={`hover:bg-slate-50 ${editUser?.id === u.id ? 'bg-brand-50' : ''}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} src={u.photoURL} size="h-9 w-9" />
                    <div>
                      <p className="font-medium text-slate-900">{u.name}</p>
                      <p className="text-xs text-slate-400">{u.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><Badge tone="brand">{u.referralId}</Badge></td>
                <td className="px-4 py-3 text-slate-500">{u.trade}</td>
                <td className="px-4 py-3 text-right">{num(u.referralCount)}</td>
                <td className="px-4 py-3 text-right">{inr(u.salesTotal)}</td>
                <td className="px-4 py-3 text-right font-semibold text-amber-600">{num(u.points)}</td>
                <td className="px-4 py-3 text-right text-slate-400">{dateStr(u.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(u)} className="btn-ghost px-3 py-1.5 text-xs">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination {...paged} onChange={paged.setPage} label="users" />

      {/* ================================================================
          EDIT DRAWER — slides in from the right; list stays visible
          ================================================================ */}
      {editUser && (
        <>
          {/* light backdrop — list visible behind it */}
          <div className="fixed inset-0 z-40 bg-black/25" onClick={closeEdit} />

          {/* panel */}
          <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-115 animate-[slideInRight_.22s_ease-out] flex-col overflow-y-auto bg-white shadow-2xl">

            {/* header */}
            <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-5 py-4">
              <Avatar name={editUser.name} src={editUser.photoURL} size="h-10 w-10" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-slate-900">{editUser.name}</p>
                <p className="truncate text-xs text-slate-500">{editUser.email}</p>
              </div>
              <button onClick={closeEdit} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-5">

              {/* ── Section 1: Profile Info ── */}
              <section>
                <DrawerSection>Profile Info</DrawerSection>
                <div className="space-y-3">
                  <div>
                    <label className="label">Full Name</label>
                    <FormField icon={User}>
                      <input
                        className="w-full bg-transparent py-2.5 text-sm outline-none"
                        placeholder="Full name"
                        value={editForm.name}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      />
                    </FormField>
                  </div>
                  <div>
                    <label className="label">Phone Number</label>
                    <FormField icon={Phone}>
                      <input
                        type="tel"
                        className="w-full bg-transparent py-2.5 text-sm outline-none"
                        placeholder="10-digit mobile"
                        value={editForm.phone}
                        onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                      />
                    </FormField>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Trade</label>
                      <select
                        className="input"
                        value={editForm.trade}
                        onChange={(e) => setEditForm((f) => ({ ...f, trade: e.target.value }))}
                      >
                        {TRADES.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">City</label>
                      <input
                        className="input"
                        placeholder="City"
                        value={editForm.city}
                        onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))}
                      />
                    </div>
                  </div>
                  {profileErr && <p className="text-sm text-rose-600">{profileErr}</p>}
                  {profileMsg && <p className="text-sm text-emerald-600">{profileMsg}</p>}
                  <button onClick={saveProfile} disabled={profileBusy} className="btn-primary w-full">
                    {profileBusy ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                    Save Profile
                  </button>
                </div>
              </section>

              <hr className="border-slate-100" />

              {/* ── Section 2: Adjust Points ── */}
              <section>
                <DrawerSection>Adjust Points</DrawerSection>
                <div className="mb-3 flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3">
                  <span className="text-sm text-slate-600">Current balance</span>
                  <span className="font-bold text-amber-600">{num(editUser.points)} pts</span>
                </div>
                <div className="flex gap-2">
                  <input
                    className="input flex-1"
                    type="number"
                    min="0"
                    placeholder="Points amount"
                    value={delta}
                    onChange={(e) => setDelta(e.target.value)}
                  />
                  <button onClick={() => adjustPoints(1)} disabled={pointsBusy || !delta} className="btn-primary px-4">
                    <Plus className="h-4 w-4" />
                  </button>
                  <button onClick={() => adjustPoints(-1)} disabled={pointsBusy || !delta} className="btn-danger px-4">
                    <Minus className="h-4 w-4" />
                  </button>
                </div>
              </section>

              <hr className="border-slate-100" />

              {/* ── Section 3: Security ── */}
              <section>
                <DrawerSection>Security</DrawerSection>
                <div className="space-y-3">
                  <div>
                    <label className="label">Stored Password</label>
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="flex-1 font-mono text-sm tracking-wider">
                        {showStoredPwd
                          ? (editUser.plainPassword || editUser.password || '—')
                          : '•'.repeat(Math.max(8, (editUser.plainPassword || editUser.password || '').length))}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowStoredPwd((s) => !s)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        {showStoredPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {!editUser.plainPassword && !editUser.password && (
                      <p className="mt-1 text-xs text-slate-400">
                        No stored password — Google sign-in or pre-existing account.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="label">Set New Password</label>
                    <FormField icon={Lock}>
                      <input
                        type={showNewPwd ? 'text' : 'password'}
                        className="w-full bg-transparent py-2.5 text-sm outline-none"
                        placeholder="New password (min 6 chars)"
                        value={newPwd}
                        onChange={(e) => setNewPwd(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPwd((s) => !s)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </FormField>
                  </div>
                  {pwdErr && <p className="text-sm text-rose-600">{pwdErr}</p>}
                  {pwdMsg && <p className="text-sm text-emerald-600">{pwdMsg}</p>}
                  <button
                    onClick={submitPwdChange}
                    disabled={pwdBusy || !newPwd}
                    className="btn-primary w-full"
                  >
                    {pwdBusy ? <Spinner className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
                    Change Password
                  </button>
                </div>
              </section>

            </div>
          </div>

          <style>{`@keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
        </>
      )}

      {/* ================================================================
          CREATE USER MODAL
          ================================================================ */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create User Account" maxWidth="max-w-lg">
        <form onSubmit={submitCreate} className="space-y-4">
          <div>
            <label className="label">Full Name *</label>
            <FormField icon={User}>
              <input className="w-full bg-transparent py-2.5 text-sm outline-none" placeholder="Full name" value={createForm.name} onChange={setField('name')} required />
            </FormField>
          </div>
          <div>
            <label className="label">Email *</label>
            <FormField icon={Mail}>
              <input type="email" className="w-full bg-transparent py-2.5 text-sm outline-none" placeholder="user@example.com" value={createForm.email} onChange={setField('email')} required />
            </FormField>
          </div>
          <div>
            <label className="label">Phone Number</label>
            <FormField icon={Phone}>
              <input type="tel" className="w-full bg-transparent py-2.5 text-sm outline-none" placeholder="10-digit mobile number" value={createForm.phone} onChange={setField('phone')} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Trade</label>
              <select className="input" value={createForm.trade} onChange={setField('trade')}>
                {TRADES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">City</label>
              <input className="input" placeholder="City" value={createForm.city} onChange={setField('city')} />
            </div>
          </div>
          <div>
            <label className="label">Password *</label>
            <FormField icon={Lock}>
              <input
                type={showCreatePwd ? 'text' : 'password'}
                className="w-full bg-transparent py-2.5 text-sm outline-none"
                placeholder="Min 6 characters"
                value={createForm.password}
                onChange={setField('password')}
                required
              />
              <button type="button" onClick={() => setShowCreatePwd((s) => !s)} className="text-slate-400 hover:text-slate-600">
                {showCreatePwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </FormField>
          </div>
          {createErr && <p className="text-sm text-rose-600">{createErr}</p>}
          <button type="submit" disabled={createBusy} className="btn-primary w-full">
            {createBusy ? <Spinner className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            Create Account
          </button>
        </form>
      </Modal>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-2">
      <p className="font-bold text-slate-900">{value}</p>
      <p className="text-slate-400">{label}</p>
    </div>
  )
}

function DrawerSection({ children }) {
  return <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{children}</h4>
}

function FormField({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/30">
      <Icon className="h-4 w-4 shrink-0 text-slate-400" />
      {children}
    </div>
  )
}
