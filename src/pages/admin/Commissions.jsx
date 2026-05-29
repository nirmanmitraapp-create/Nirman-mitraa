import { useEffect, useState, useMemo } from 'react'
import { Search, Coins, IndianRupee, ReceiptIndianRupee } from 'lucide-react'
import { listSales } from '../../services/db'
import { SectionHeader, PageLoader, StatCard, EmptyState, Badge } from '../../components/ui/index.jsx'
import { inr, num, dateStr } from '../../utils/format'

export default function Commissions() {
  const [sales, setSales] = useState(null)
  const [q, setQ] = useState('')

  useEffect(() => { listSales().then(setSales) }, [])

  const filtered = useMemo(
    () =>
      (sales || []).filter(
        (s) =>
          s.customerName?.toLowerCase().includes(q.toLowerCase()) ||
          s.referralId?.toLowerCase().includes(q.toLowerCase()) ||
          s.material?.toLowerCase().includes(q.toLowerCase()),
      ),
    [sales, q],
  )

  if (!sales) return <PageLoader />

  const totalAmt = filtered.reduce((a, s) => a + (s.amount || 0), 0)
  const totalPts = filtered.reduce((a, s) => a + (s.commissionPoints || 0), 0)

  return (
    <div className="space-y-5">
      <SectionHeader title="Commission Management" subtitle="Ledger of all recorded sales and points issued" />

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard icon={ReceiptIndianRupee} tone="blue" label="Transactions" value={num(filtered.length)} />
        <StatCard icon={IndianRupee} tone="brand" label="Sales value" value={inr(totalAmt)} />
        <StatCard icon={Coins} tone="gold" label="Points issued" value={num(totalPts)} />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <input className="input pl-9" placeholder="Search by customer, referral ID, material…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ReceiptIndianRupee} title="No sales found" />
      ) : (
        <>
          {/* Mobile */}
          <div className="space-y-3 lg:hidden">
            {filtered.map((s) => (
              <div key={s.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{s.customerName}</p>
                    <p className="truncate text-xs text-slate-500">{s.material || 'Purchase'}</p>
                  </div>
                  <Badge tone="brand">{s.referralId || '—'}</Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-800">{inr(s.amount)}</span>
                  <span className="font-semibold text-emerald-600">+{num(s.commissionPoints)} pts</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{dateStr(s.createdAt)} · by {s.recordedBy}</p>
              </div>
            ))}
          </div>

          {/* Desktop */}
          <div className="card hidden overflow-x-auto lg:block">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Referral</th>
                  <th className="px-4 py-3 font-medium">Material</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 text-right font-medium">Points</th>
                  <th className="px-4 py-3 font-medium">Recorded by</th>
                  <th className="px-4 py-3 text-right font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {s.customerName}
                      {s.customerPhone && <span className="block text-xs text-slate-400">{s.customerPhone}</span>}
                    </td>
                    <td className="px-4 py-3"><Badge tone="brand">{s.referralId || '—'}</Badge></td>
                    <td className="px-4 py-3 text-slate-500">{s.material || '—'}</td>
                    <td className="px-4 py-3 text-right font-medium">{inr(s.amount)}</td>
                    <td className="px-4 py-3 text-right text-emerald-600">+{num(s.commissionPoints)}</td>
                    <td className="px-4 py-3 text-slate-500">{s.recordedBy}</td>
                    <td className="px-4 py-3 text-right text-slate-400">{dateStr(s.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
