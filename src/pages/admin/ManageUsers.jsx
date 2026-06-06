import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, UserPlus, Eye, EyeOff, Lock, Phone, User, ChevronUp, ChevronDown, X, SlidersHorizontal, Camera, Loader2 } from 'lucide-react'
import { getLeaderboard, adminCreateUser } from '../../services/db'
import {
  SectionHeader, PageLoader, Avatar, Modal, Badge, Pagination, usePaged, Spinner,
} from '../../components/ui/index.jsx'
import { uploadImage, isCloudinaryConfigured } from '../../services/cloudinary'
import { num, inr, dateStr } from '../../utils/format'

const TRADES = ['Mason', 'Plumber', 'Electrician', 'Contractor', 'Painter', 'Carpenter', 'Mistri', 'Other']
const SORT_OPTIONS = [
  { label: 'Name (A–Z)',       key: 'name',         dir: 'asc'  },
  { label: 'Name (Z–A)',       key: 'name',         dir: 'desc' },
  { label: 'Points ↑',         key: 'points',       dir: 'asc'  },
  { label: 'Points ↓',         key: 'points',       dir: 'desc' },
  { label: 'Referrals ↑',      key: 'referralCount', dir: 'asc'  },
  { label: 'Referrals ↓',      key: 'referralCount', dir: 'desc' },
  { label: 'Joined (newest)',   key: 'createdAt',    dir: 'desc' },
  { label: 'Joined (oldest)',   key: 'createdAt',    dir: 'asc'  },
]

export default function ManageUsers() {
  const navigate = useNavigate()
  const [rows, setRows] = useState(null)

  // filters
  const [q, setQ]             = useState('')
  const [tradeFilt, setTradeFilt] = useState('')
  const [sortKey, setSortKey] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [showFilters, setShowFilters] = useState(false)

  // create modal
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', phone: '', trade: 'Mason', city: '', password: '', photoURL: '' })
  const [showCreatePwd, setShowCreatePwd] = useState(false)
  const [createBusy, setCreateBusy] = useState(false)
  const [createErr, setCreateErr] = useState('')
  const [photoUploading, setPhotoUploading] = useState(false)
  const photoRef = useRef(null)

  const load = () => getLeaderboard().then(setRows)
  useEffect(() => { load() }, [])

  const activeFilters = [q, tradeFilt].filter(Boolean).length

  const filtered = (rows || [])
    .filter((u) => {
      const matchQ = !q || (
        u.name?.toLowerCase().includes(q.toLowerCase()) ||
        u.referralId?.toLowerCase().includes(q.toLowerCase()) ||
        u.phone?.includes(q)
      )
      const matchTrade = !tradeFilt || u.trade === tradeFilt
      return matchQ && matchTrade
    })
    .sort((a, b) => {
      const av = a[sortKey] ?? ''
      const bv = b[sortKey] ?? ''
      const cmp = typeof av === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })

  const paged = usePaged(filtered, 10)

  if (!rows) return <PageLoader />

  const setField = (k) => (e) => setCreateForm((f) => ({ ...f, [k]: e.target.value }))

  const openCreate = () => {
    setCreateForm({ name: '', phone: '', trade: 'Mason', city: '', password: '', photoURL: '' })
    setCreateErr(''); setShowCreatePwd(false); setPhotoUploading(false); setCreateOpen(true)
  }

  const onPickPhoto = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoUploading(true)
    try {
      const url = await uploadImage(file)
      setCreateForm((f) => ({ ...f, photoURL: url }))
    } catch (err) {
      setCreateErr(err.message)
    } finally {
      setPhotoUploading(false)
    }
  }

  const submitCreate = async (e) => {
    e.preventDefault(); setCreateErr('')
    if (!createForm.name.trim()) return setCreateErr('Full name is required.')
    if (!/^[1-9]\d{9}$/.test(createForm.phone.trim())) return setCreateErr('Enter a valid 10-digit mobile number (cannot start with 0).')
    if (createForm.password.length < 6) return setCreateErr('Password must be at least 6 characters.')
    setCreateBusy(true)
    const syntheticEmail = `${createForm.phone.trim()}@nirmanmitra.com`
    try {
      await adminCreateUser({ ...createForm, email: syntheticEmail })
      setCreateOpen(false); load()
    } catch (err) {
      setCreateErr(err.message || 'Failed to create account.')
    } finally {
      setCreateBusy(false)
    }
  }

  const handleSortChange = (e) => {
    const opt = SORT_OPTIONS[e.target.value]
    setSortKey(opt.key)
    setSortDir(opt.dir)
  }

  const clearFilters = () => { setQ(''); setTradeFilt('') }

  const toggleColumnSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        title="User Management"
        subtitle={`${rows.length} registered Mistris & Contractors`}
        action={
          <button onClick={openCreate} className="btn-primary text-sm">
            <UserPlus className="h-4 w-4" /> Create User
          </button>
        }
      />

      {/* ── Search + Filter bar ── */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search by name, referral ID, or phone…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {q && (
              <button
                onClick={() => setQ('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`relative flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
              showFilters || activeFilters > 0
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilters > 0 && (
              <span className="grid h-4 w-4 place-items-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="card flex flex-wrap items-end gap-3 p-4">
            <div className="min-w-40 flex-1">
              <label className="label">Trade</label>
              <select
                className="input"
                value={tradeFilt}
                onChange={(e) => setTradeFilt(e.target.value)}
              >
                <option value="">All Trades</option>
                {TRADES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div className="min-w-45 flex-1">
              <label className="label">Sort by</label>
              <select
                className="input"
                value={SORT_OPTIONS.findIndex((o) => o.key === sortKey && o.dir === sortDir)}
                onChange={handleSortChange}
              >
                {SORT_OPTIONS.map((o, i) => (
                  <option key={i} value={i}>{o.label}</option>
                ))}
              </select>
            </div>

            {activeFilters > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-500 hover:bg-slate-50"
              >
                <X className="h-3.5 w-3.5" /> Clear filters
              </button>
            )}
          </div>
        )}

        {filtered.length !== rows.length && (
          <p className="text-xs text-slate-500">
            Showing <b className="text-slate-700">{filtered.length}</b> of {rows.length} users
            {activeFilters > 0 && (
              <button onClick={clearFilters} className="ml-2 text-brand-600 hover:underline">
                Clear filters
              </button>
            )}
          </p>
        )}
      </div>

      {/* ── Table (all screen sizes, horizontal scroll on mobile) ── */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-160 text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">
                  <SortHeader label="User" colKey="name" sortKey={sortKey} sortDir={sortDir} onSort={toggleColumnSort} />
                </th>
                <th className="px-4 py-3 font-medium">Referral ID</th>
                <th className="px-4 py-3 font-medium">Trade</th>
                <th className="px-4 py-3 text-right font-medium">
                  <SortHeader label="Referrals" colKey="referralCount" sortKey={sortKey} sortDir={sortDir} onSort={toggleColumnSort} right />
                </th>
                <th className="px-4 py-3 text-right font-medium">Sales</th>
                <th className="px-4 py-3 text-right font-medium">
                  <SortHeader label="Points" colKey="points" sortKey={sortKey} sortDir={sortDir} onSort={toggleColumnSort} right />
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  <SortHeader label="Joined" colKey="createdAt" sortKey={sortKey} sortDir={sortDir} onSort={toggleColumnSort} right />
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paged.pageItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">
                    No users match your filters.
                  </td>
                </tr>
              ) : (
                paged.pageItems.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} src={u.photoURL} size="h-9 w-9" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">{u.name}</p>
                          <p className="truncate text-xs text-slate-400">{u.phone || u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="brand">{u.referralId}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{u.trade || '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{num(u.referralCount)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{inr(u.salesTotal)}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-amber-600">{num(u.points)}</td>
                    <td className="px-4 py-3 text-right text-slate-400 tabular-nums">{dateStr(u.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => navigate(`/admin/users/${u.id}`)}
                        className="btn-ghost px-3 py-1.5 text-xs"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination {...paged} onChange={paged.setPage} label="users" />

      {/* ── Create user modal ── */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create User Account" maxWidth="max-w-lg">
        <form onSubmit={submitCreate} className="space-y-4">
          {/* Profile photo */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <Avatar name={createForm.name || 'U'} src={createForm.photoURL} size="h-20 w-20" />
              {isCloudinaryConfigured && (
                <button
                  type="button"
                  onClick={() => photoRef.current?.click()}
                  disabled={photoUploading}
                  className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-brand-600 text-white shadow-md hover:bg-brand-700 disabled:opacity-60"
                >
                  {photoUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                </button>
              )}
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={onPickPhoto} />
            </div>
            <p className="text-xs text-slate-400">{isCloudinaryConfigured ? 'Tap camera to upload photo' : 'Photo upload unavailable (Cloudinary not configured)'}</p>
          </div>
          <div>
            <label className="label">Full Name *</label>
            <FormField icon={User}>
              <input className="w-full bg-transparent py-2.5 text-sm outline-none" placeholder="Full name" value={createForm.name} onChange={setField('name')} required />
            </FormField>
          </div>
          <div>
            <label className="label">Mobile Number *</label>
            <FormField icon={Phone}>
              <input
                type="tel"
                className="w-full bg-transparent py-2.5 text-sm outline-none"
                placeholder="10-digit mobile number"
                value={createForm.phone}
                maxLength={10}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').replace(/^0+/, '')
                  setCreateForm((f) => ({ ...f, phone: val.slice(0, 10) }))
                }}
                required
              />
            </FormField>
            <p className="mt-1 text-xs text-slate-400">Used as login credential ({createForm.phone.trim() || '1234567890'}@nirmanmitra.com)</p>
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

function SortHeader({ label, colKey, sortKey, sortDir, onSort, right = false }) {
  const active = sortKey === colKey
  return (
    <button
      onClick={() => onSort(colKey)}
      className={`flex items-center gap-1 font-medium uppercase tracking-wide transition hover:text-slate-700 ${right ? 'ml-auto' : ''} ${active ? 'text-brand-700' : 'text-slate-400'}`}
    >
      {label}
      <span className="flex flex-col">
        <ChevronUp   className={`-mb-1 h-2.5 w-2.5 ${active && sortDir === 'asc'  ? 'text-brand-600' : 'text-slate-300'}`} />
        <ChevronDown className={`h-2.5 w-2.5        ${active && sortDir === 'desc' ? 'text-brand-600' : 'text-slate-300'}`} />
      </span>
    </button>
  )
}

function FormField({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/30">
      <Icon className="h-4 w-4 shrink-0 text-slate-400" />
      {children}
    </div>
  )
}
