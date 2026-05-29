import { useEffect, useState } from 'react'
import { Check, Search, UserCheck, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { recordSale, listUsers } from '../../services/db'
import { SectionHeader, Spinner } from '../../components/ui/index.jsx'
import { num, inr } from '../../utils/format'

export default function RecordSale() {
  const { profile } = useAuth()
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({
    referralId: '', customerName: '', customerPhone: '',
    amount: '', commissionPoints: '', material: '', note: '',
  })
  const [matched, setMatched] = useState(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const [pct, setPct] = useState('2') // commission percentage (editable)
  const [pointsEdited, setPointsEdited] = useState(false) // admin manually changed points?

  // load users only to validate/match the entered referral ID (no listing shown)
  useEffect(() => {
    listUsers().then((u) => setUsers(u.filter((x) => x.role !== 'admin')))
  }, [])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  // referral validation ----------------------------------------------------
  const REF_LEN = 8 // referral IDs look like "MR-XXXXX"
  const rawRef = form.referralId.trim()
  const refLen = rawRef.length
  const refComplete = refLen >= REF_LEN
  // valid to submit: either no referral typed (walk-in) OR a matched ID
  const refValid = rawRef === '' || !!matched
  const counterTone = matched ? 'text-emerald-600' : refComplete && !matched ? 'text-rose-600' : 'text-slate-400'
  const ringClass = matched
    ? '!border-emerald-400 focus:!ring-emerald-500/30'
    : rawRef && refComplete && !matched
      ? '!border-rose-400 focus:!ring-rose-500/30'
      : ''

  // live match referral ID -> user
  useEffect(() => {
    const id = form.referralId.trim().toUpperCase()
    setMatched(id ? users.find((u) => u.referralId?.toUpperCase() === id) || false : null)
  }, [form.referralId, users])

  // auto-fill commission points from amount × % (unless admin overrode it)
  useEffect(() => {
    if (pointsEdited) return
    const amt = Number(form.amount) || 0
    const rate = Number(pct) || 0
    const computed = amt > 0 ? String(Math.round((amt * rate) / 100)) : ''
    setForm((f) => (f.commissionPoints === computed ? f : { ...f, commissionPoints: computed }))
  }, [form.amount, pct, pointsEdited])

  // editing % re-enables auto-calc; editing points directly switches to manual
  const onPctChange = (e) => { setPct(e.target.value); setPointsEdited(false) }
  const onPointsChange = (e) => { setPointsEdited(true); setForm((f) => ({ ...f, commissionPoints: e.target.value })) }
  const resetAuto = () => setPointsEdited(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!refValid) return // red flag is already shown; block submission
    setBusy(true)
    try {
      await recordSale({ ...form, recordedBy: profile?.name || 'Admin' })
      setToast(`Sale recorded! ${matched ? `${num(form.commissionPoints)} pts credited to ${matched.name}.` : ''}`)
      setForm({ referralId: '', customerName: '', customerPhone: '', amount: '', commissionPoints: '', material: '', note: '' })
      setPointsEdited(false)
      setTimeout(() => setToast(''), 4000)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <SectionHeader title="Record a Sale" subtitle="Log a purchase and credit commission to the referring Mistri" />

      <form onSubmit={submit} className="card space-y-4 p-5 sm:p-6">
        {/* Referral lookup */}
        <div>
          <label className="label flex items-center justify-between">
            <span>Referral ID (Mistri / Contractor)</span>
            {rawRef && <span className={`text-xs font-semibold tabular-nums ${counterTone}`}>{refLen}/{REF_LEN}</span>}
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              className={`input px-9 uppercase ${ringClass}`}
              placeholder="Enter the customer's Referral ID"
              value={form.referralId}
              onChange={set('referralId')}
              autoComplete="off"
            />
            {matched && <UserCheck className="absolute right-3 top-3 h-4 w-4 text-emerald-500" />}
            {!matched && rawRef && refComplete && <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-rose-500" />}
          </div>
          {/* ✅ matched */}
          {matched && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <UserCheck className="h-4 w-4 shrink-0" /> Matched: <b>{matched.name}</b> · {matched.trade}{matched.city ? ` · ${matched.city}` : ''}
            </div>
          )}
          {/* … still typing */}
          {!matched && rawRef !== '' && !refComplete && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">
              <AlertCircle className="h-4 w-4 shrink-0" /> Referral IDs are {REF_LEN} characters (format <b className="font-mono">MR-XXXXX</b>). Keep typing… {refLen}/{REF_LEN}
            </div>
          )}
          {/* ❌ complete but no match */}
          {!matched && rawRef !== '' && refComplete && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" /> No referrer found with ID “<b>{rawRef.toUpperCase()}</b>”. Please check and try again.
            </div>
          )}
          {/* empty hint */}
          {rawRef === '' && (
            <p className="mt-2 text-xs text-slate-400">
              Format <span className="font-mono">MR-XXXXX</span> ({REF_LEN} characters) — or leave blank for a walk-in sale.
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Customer name</label>
            <input className="input" value={form.customerName} onChange={set('customerName')} placeholder="Buyer's name" required />
          </div>
          <div>
            <label className="label">Customer phone</label>
            <input className="input" value={form.customerPhone} onChange={set('customerPhone')} placeholder="Optional" inputMode="tel" />
          </div>
        </div>

        <div>
          <label className="label">Material / Items</label>
          <input className="input" value={form.material} onChange={set('material')} placeholder="e.g. Cement, Steel, Bricks" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Sale amount (₹)</label>
            <input className="input" type="number" min="0" value={form.amount} onChange={set('amount')} placeholder="0" required />
          </div>
          <div>
            <label className="label">Commission %</label>
            <div className="relative">
              <input className="input pr-7" type="number" min="0" step="0.5" value={pct} onChange={onPctChange} placeholder="2" />
              <span className="absolute right-3 top-2.5 text-sm text-slate-400">%</span>
            </div>
          </div>
          <div>
            <label className="label flex items-center justify-between">
              <span>Commission points</span>
              {pointsEdited && (
                <button type="button" onClick={resetAuto} className="text-xs font-medium text-brand-700 hover:underline">↻ auto</button>
              )}
            </label>
            <input className="input" type="number" min="0" value={form.commissionPoints} onChange={onPointsChange} placeholder="0" required />
          </div>
        </div>
        <p className="-mt-2 text-xs text-slate-400">
          Points auto-fill from amount × {Number(pct) || 0}%
          {pointsEdited ? ' — manually overridden (tap ↻ auto to recalculate).' : '. You can also edit the points directly.'}
        </p>

        <div>
          <label className="label">Note (optional)</label>
          <textarea className="input" rows={2} value={form.note} onChange={set('note')} placeholder="Any remarks…" />
        </div>

        {(form.amount || form.commissionPoints) && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-4 text-sm">
            <span className="text-slate-500">Sale value: <b className="text-slate-800">{inr(form.amount)}</b></span>
            <span className="text-slate-500">Crediting: <b className="text-emerald-600">+{num(form.commissionPoints)} pts</b></span>
          </div>
        )}

        <button type="submit" disabled={busy || !refValid} className="btn-primary w-full">
          {busy ? <Spinner className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          {!refValid && rawRef ? 'Enter a valid Referral ID' : 'Record Sale'}
        </button>
      </form>

      {toast && (
        <div className="fixed inset-x-4 bottom-6 z-50 mx-auto flex max-w-md items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm text-white shadow-lg">
          <Check className="h-4 w-4 shrink-0" /> {toast}
        </div>
      )}
    </div>
  )
}
