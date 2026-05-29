import { useEffect, useState } from 'react'
import { Search, Coins, Plus, Minus } from 'lucide-react'
import { listUsers, updateUser, getLeaderboard } from '../../services/db'
import { SectionHeader, PageLoader, Avatar, Modal, Badge } from '../../components/ui/index.jsx'
import { num, inr, dateStr } from '../../utils/format'

export default function ManageUsers() {
  const [rows, setRows] = useState(null)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(null) // user being adjusted
  const [delta, setDelta] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => getLeaderboard().then(setRows)
  useEffect(() => { load() }, [])

  if (!rows) return <PageLoader />

  const filtered = rows.filter(
    (u) =>
      u.name?.toLowerCase().includes(q.toLowerCase()) ||
      u.referralId?.toLowerCase().includes(q.toLowerCase()) ||
      u.phone?.includes(q),
  )

  const adjust = async (sign) => {
    const amt = sign * Math.abs(Number(delta) || 0)
    if (!amt) return
    setBusy(true)
    await updateUser(active.id, {
      points: Math.max(0, (active.points || 0) + amt),
      totalEarned: amt > 0 ? (active.totalEarned || 0) + amt : active.totalEarned,
    })
    setBusy(false)
    setActive(null)
    setDelta('')
    load()
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="User Management" subtitle={`${rows.length} registered Mistris & Contractors`} />

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <input className="input pl-9" placeholder="Search by name, referral ID, or phone…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 lg:hidden">
        {filtered.map((u) => (
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
            <button onClick={() => setActive(u)} className="btn-ghost mt-3 w-full text-xs"><Coins className="h-4 w-4" /> Adjust points</button>
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
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
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
                  <button onClick={() => setActive(u)} className="btn-ghost px-3 py-1.5 text-xs">Adjust</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!active} onClose={() => setActive(null)} title="Adjust points">
        {active && (
          <div>
            <div className="flex items-center gap-3">
              <Avatar name={active.name} />
              <div>
                <p className="font-semibold text-slate-900">{active.name}</p>
                <p className="text-sm text-slate-500">Current balance: <b>{num(active.points)} pts</b></p>
              </div>
            </div>
            <label className="label mt-4">Points to add or remove</label>
            <input className="input" type="number" min="0" value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="e.g. 500" autoFocus />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button onClick={() => adjust(1)} disabled={busy} className="btn-primary"><Plus className="h-4 w-4" /> Add</button>
              <button onClick={() => adjust(-1)} disabled={busy} className="btn-danger"><Minus className="h-4 w-4" /> Deduct</button>
            </div>
          </div>
        )}
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
