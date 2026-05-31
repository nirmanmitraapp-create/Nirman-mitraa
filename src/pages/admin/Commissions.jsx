import { useEffect, useState, useMemo, useRef } from 'react'
import { Search, Coins, ReceiptIndianRupee, Plus, UserCheck, AlertCircle, Check, ChevronDown } from 'lucide-react'
import { DateRangePicker } from '../../components/ui/DateRangePicker'
import { listSales, listUsers, recordSale } from '../../services/db'
import { useAuth } from '../../context/AuthContext'
import {
  SectionHeader, PageLoader, StatCard, EmptyState, Badge, Avatar,
  Pagination, usePaged, Modal, Spinner,
} from '../../components/ui/index.jsx'
import { num, dateStr } from '../../utils/format'

export default function Commissions() {
  const { profile } = useAuth()
  const [sales, setSales] = useState(null)
  const [users, setUsers] = useState([])
  const [q, setQ] = useState('')
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined })

  // add-commission modal
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ referralId: '', commissionPoints: '' })
  const [pick, setPick] = useState('')
  const [dropOpen, setDropOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const pickRef = useRef(null)

  const load = () => {
    listSales().then(setSales)
    listUsers().then((u) => setUsers(u.filter((x) => x.role !== 'admin')))
  }
  useEffect(() => { load() }, [])

  // close the referrer dropdown on outside click
  useEffect(() => {
    const onClick = (e) => { if (pickRef.current && !pickRef.current.contains(e.target)) setDropOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  // resolve the referring person for each sale (by userId, falling back to referralId)
  const refName = (s) => {
    const u = users.find(
      (x) => (s.userId && x.id === s.userId) || x.referralId?.toUpperCase() === s.referralId?.toUpperCase(),
    )
    return u?.name || '—'
  }

  const rows = useMemo(() => {
    const list = (sales || []).map((s) => ({ ...s, name: refName(s) }))
    const ql = q.toLowerCase()
    const fromMs = dateRange.from ? new Date(dateRange.from).setHours(0, 0, 0, 0) : null
    const toMs = dateRange.to ? new Date(dateRange.to).setHours(23, 59, 59, 999) : null
    return list.filter((s) => {
      if (ql && !s.name?.toLowerCase().includes(ql) && !s.referralId?.toLowerCase().includes(ql)) return false
      if (fromMs && s.createdAt < fromMs) return false
      if (toMs && s.createdAt > toMs) return false
      return true
    })
  }, [sales, users, q, dateRange])

  const paged = usePaged(rows, 10)

  // ---- add commission modal logic ----
  const pq = pick.trim().toLowerCase()
  const matched = users.find((u) => u.referralId?.toUpperCase() === form.referralId.toUpperCase()) || null
  const candidates = pq
    ? users.filter((u) =>
        [u.name, u.referralId, u.trade, u.city].filter(Boolean).some((v) => v.toLowerCase().includes(pq)))
    : users
  const points = Number(form.commissionPoints) || 0

  const openModal = () => {
    setForm({ referralId: '', commissionPoints: '' })
    setPick('')
    setDropOpen(false)
    setOpen(true)
  }
  const choose = (u) => { setForm((f) => ({ ...f, referralId: u.referralId })); setPick(''); setDropOpen(false) }

  const submit = async (e) => {
    e.preventDefault()
    if (!matched) return
    setBusy(true)
    try {
      await recordSale({ ...form, recordedBy: profile?.name || 'Admin' })
      setToast(`${num(form.commissionPoints)} pts credited to ${matched.name}.`)
      setOpen(false)
      load()
      setTimeout(() => setToast(''), 4000)
    } finally {
      setBusy(false)
    }
  }

  if (!sales) return <PageLoader />

  const totalPts = rows.reduce((a, s) => a + (s.commissionPoints || 0), 0)

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Commission Management"
        subtitle="Ledger of all commission points issued"
        action={<button onClick={openModal} className="btn-primary text-sm"><Plus className="h-4 w-4" /> Add Commission</button>}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <StatCard icon={ReceiptIndianRupee} tone="blue" label="Transactions" value={num(rows.length)} />
        <StatCard icon={Coins} tone="gold" label="Points issued" value={num(totalPts)} />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <input className="input pl-9" placeholder="Search by name or referral ID…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <DateRangePicker
        from={dateRange.from}
        to={dateRange.to}
        onChange={setDateRange}
      />

      {rows.length === 0 ? (
        <EmptyState icon={ReceiptIndianRupee} title="No commissions found" subtitle="Add a commission to credit points to a Mistri." />
      ) : (
        <>
          {/* Mobile */}
          <div className="space-y-3 lg:hidden">
            {paged.pageItems.map((s) => (
              <div key={s.id} className="card p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={s.name} size="h-9 w-9" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{s.name}</p>
                    <Badge tone="brand">{s.referralId || '—'}</Badge>
                  </div>
                  <span className="font-semibold text-emerald-600">+{num(s.commissionPoints)} pts</span>
                </div>
                <p className="mt-2 text-xs text-slate-400">{dateStr(s.createdAt)}</p>
              </div>
            ))}
          </div>

          {/* Desktop */}
          <div className="card hidden overflow-x-auto lg:block">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Referring person</th>
                  <th className="px-4 py-3 font-medium">Referral ID</th>
                  <th className="px-4 py-3 text-right font-medium">Points</th>
                  <th className="px-4 py-3 text-right font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paged.pageItems.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.name} size="h-8 w-8" />
                        <span className="font-medium text-slate-800">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge tone="brand">{s.referralId || '—'}</Badge></td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600">+{num(s.commissionPoints)}</td>
                    <td className="px-4 py-3 text-right text-slate-400">{dateStr(s.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination {...paged} onChange={paged.setPage} label="commissions" />
        </>
      )}

      {/* Add commission modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Add Commission" maxWidth="max-w-2xl" bodyClassName="overflow-visible">
        <form onSubmit={submit} className="space-y-5">
          {/* Referral picker */}
          <div>
            <label className="label">Referral ID (Mistri / Contractor)</label>

            {matched ? (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50/60 px-3 py-2.5">
                <Avatar name={matched.name} size="h-9 w-9" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-slate-800">{matched.name}</div>
                  <div className="truncate text-xs text-slate-500">
                    <span className="font-mono">{matched.referralId}</span> · {matched.trade}{matched.city ? ` · ${matched.city}` : ''}
                  </div>
                </div>
                <UserCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, referralId: '' }))}
                  className="text-xs font-medium text-brand-700 hover:underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <div ref={pickRef} className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  className="input px-9"
                  placeholder="Search by name or Referral ID…"
                  value={pick}
                  onChange={(e) => { setPick(e.target.value); setDropOpen(true) }}
                  autoComplete="off"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setDropOpen((v) => !v)}
                  className="absolute right-2 top-2 rounded-md p-1 text-slate-400 hover:bg-slate-100"
                  tabIndex={-1}
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropOpen && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                    {candidates.length === 0 ? (
                      <div className="flex items-center gap-2 px-3 py-3 text-sm text-slate-500">
                        <AlertCircle className="h-4 w-4 shrink-0" /> No referrer found{pq ? ` for “${pick}”` : ''}.
                      </div>
                    ) : (
                      candidates.map((u) => (
                        <button
                          key={u.id || u.referralId}
                          type="button"
                          onClick={() => choose(u)}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50"
                        >
                          <Avatar name={u.name} size="h-9 w-9" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-slate-800">{u.name}</div>
                            <div className="truncate text-xs text-slate-500">
                              <span className="font-mono">{u.referralId}</span> · {u.trade}{u.city ? ` · ${u.city}` : ''}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Commission points */}
          <div>
            <label className="label">Commission points</label>
            <div className="relative">
              <Coins className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                className="input px-9"
                type="number"
                min="0"
                value={form.commissionPoints}
                onChange={(e) => setForm((f) => ({ ...f, commissionPoints: e.target.value }))}
                placeholder="0"
                required
              />
            </div>
          </div>

          {points > 0 && matched && (
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm">
              <span className="text-slate-500">Crediting to {matched.name}</span>
              <span className="font-semibold text-emerald-600">+{num(points)} pts</span>
            </div>
          )}

          <button type="submit" disabled={busy || !matched} className="btn-primary w-full">
            {busy ? <Spinner className="h-4 w-4" /> : <Check className="h-4 w-4" />}
            {!matched ? 'Select a Referral ID' : 'Add Commission'}
          </button>
        </form>
      </Modal>

      {toast && (
        <div className="fixed inset-x-4 bottom-6 z-50 mx-auto flex max-w-md items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm text-white shadow-lg">
          <Check className="h-4 w-4 shrink-0" /> {toast}
        </div>
      )}
    </div>
  )
}
