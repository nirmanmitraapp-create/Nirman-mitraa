import { useEffect, useState } from 'react'
import { Plus, Wallet2, Trash2, IndianRupee, CheckCircle2 } from 'lucide-react'
import { listDues, addDue, updateDue, removeDue } from '../../services/db'
import { SectionHeader, PageLoader, StatCard, EmptyState, Modal, Badge } from '../../components/ui/index.jsx'
import { inr, dateStr } from '../../utils/format'

const blank = { customerName: '', customerPhone: '', referralId: '', amount: '', paid: '', note: '' }

export default function BuyerDues() {
  const [dues, setDues] = useState(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(blank)
  const [pay, setPay] = useState(null) // due being settled
  const [payAmt, setPayAmt] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => listDues().then(setDues)
  useEffect(() => { load() }, [])
  if (!dues) return <PageLoader />

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const totalDue = dues.filter((d) => d.status === 'pending').reduce((a, d) => a + ((d.amount || 0) - (d.paid || 0)), 0)
  const cleared = dues.filter((d) => d.status === 'cleared').length

  const create = async (e) => {
    e.preventDefault()
    setBusy(true)
    await addDue(form)
    setBusy(false)
    setOpen(false)
    setForm(blank)
    load()
  }

  const settle = async () => {
    setBusy(true)
    const newPaid = (pay.paid || 0) + (Number(payAmt) || 0)
    await updateDue(pay.id, { paid: newPaid })
    setBusy(false)
    setPay(null)
    setPayAmt('')
    load()
  }

  const del = async (id) => {
    await removeDue(id)
    load()
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Buyer Due Management"
        subtitle="Track outstanding payments from customers"
        action={<button onClick={() => setOpen(true)} className="btn-primary text-sm"><Plus className="h-4 w-4" /> Add Due</button>}
      />

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard icon={Wallet2} tone="rose" label="Outstanding" value={inr(totalDue)} />
        <StatCard icon={IndianRupee} tone="blue" label="Total entries" value={dues.length} />
        <StatCard icon={CheckCircle2} tone="green" label="Cleared" value={cleared} />
      </div>

      {dues.length === 0 ? (
        <EmptyState icon={Wallet2} title="No dues recorded" subtitle="Add a buyer due to start tracking." />
      ) : (
        <div className="space-y-3">
          {dues.map((d) => {
            const balance = (d.amount || 0) - (d.paid || 0)
            const pct = d.amount ? Math.min(100, Math.round((d.paid / d.amount) * 100)) : 0
            return (
              <div key={d.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{d.customerName}</p>
                      <Badge tone={d.status === 'cleared' ? 'green' : 'amber'}>{d.status}</Badge>
                      {d.referralId && <Badge tone="brand">{d.referralId}</Badge>}
                    </div>
                    <p className="text-xs text-slate-500">{d.customerPhone} · {dateStr(d.createdAt)}{d.note ? ` · ${d.note}` : ''}</p>
                  </div>
                  <button onClick={() => del(d.id)} className="rounded-lg p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-slate-500">
                    <span>Paid {inr(d.paid)} of {inr(d.amount)}</span>
                    <span className={balance > 0 ? 'font-semibold text-rose-600' : 'font-semibold text-emerald-600'}>
                      {balance > 0 ? `${inr(balance)} due` : 'Fully paid'}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : 'bg-brand-600'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>

                {d.status === 'pending' && (
                  <button onClick={() => { setPay(d); setPayAmt('') }} className="btn-ghost mt-3 w-full text-xs">
                    Record payment
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add due modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Add buyer due">
        <form onSubmit={create} className="space-y-3">
          <div>
            <label className="label">Customer name</label>
            <input className="input" value={form.customerName} onChange={set('customerName')} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.customerPhone} onChange={set('customerPhone')} />
            </div>
            <div>
              <label className="label">Referral ID</label>
              <input className="input uppercase" value={form.referralId} onChange={set('referralId')} placeholder="Optional" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Total amount (₹)</label>
              <input className="input" type="number" min="0" value={form.amount} onChange={set('amount')} required />
            </div>
            <div>
              <label className="label">Already paid (₹)</label>
              <input className="input" type="number" min="0" value={form.paid} onChange={set('paid')} placeholder="0" />
            </div>
          </div>
          <div>
            <label className="label">Note</label>
            <input className="input" value={form.note} onChange={set('note')} placeholder="Optional" />
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? 'Saving…' : 'Add Due'}</button>
        </form>
      </Modal>

      {/* Record payment modal */}
      <Modal open={!!pay} onClose={() => setPay(null)} title="Record payment">
        {pay && (
          <div>
            <p className="text-sm text-slate-500">
              {pay.customerName} — balance <b className="text-rose-600">{inr((pay.amount || 0) - (pay.paid || 0))}</b>
            </p>
            <label className="label mt-4">Payment received (₹)</label>
            <input className="input" type="number" min="0" value={payAmt} onChange={(e) => setPayAmt(e.target.value)} autoFocus />
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => setPayAmt(String((pay.amount || 0) - (pay.paid || 0)))} className="chip bg-slate-100 text-slate-600">
                Pay full balance
              </button>
            </div>
            <button onClick={settle} disabled={busy || !payAmt} className="btn-primary mt-4 w-full">{busy ? 'Saving…' : 'Save payment'}</button>
          </div>
        )}
      </Modal>
    </div>
  )
}
