import { useEffect, useState } from 'react'
import { Coins, ArrowDownLeft, ArrowUpRight, Gift, ReceiptIndianRupee } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { listSalesByUser, listRedemptionsByUser } from '../../services/db'
import { StatCard, SectionHeader, EmptyState, PageLoader, Badge } from '../../components/ui/index.jsx'
import { num, inr, dateStr } from '../../utils/format'

const statusTone = { pending: 'amber', approved: 'blue', delivered: 'green', rejected: 'rose' }

export default function Wallet() {
  const { profile } = useAuth()
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('earned')

  useEffect(() => {
    if (!profile) return
    Promise.all([
      listSalesByUser(profile.id, profile.referralId),
      listRedemptionsByUser(profile.id),
    ]).then(([sales, redemptions]) => setData({ sales, redemptions }))
  }, [profile])

  if (!data) return <PageLoader />

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <StatCard icon={Coins} tone="gold" label="Available Points" value={num(profile.points)} sub="ready to redeem" />
        <StatCard icon={ArrowUpRight} tone="green" label="Lifetime Earned" value={num(profile.totalEarned)} sub="total points" />
      </div>

      <div className="card overflow-hidden">
        <div className="flex border-b border-slate-100">
          {[
            { k: 'earned', label: 'Points earned' },
            { k: 'redeemed', label: 'Redemptions' },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                tab === t.k ? 'border-b-2 border-brand-600 text-brand-700' : 'text-slate-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'earned' && (
          <div className="divide-y divide-slate-100">
            {data.sales.length === 0 ? (
              <EmptyState icon={ReceiptIndianRupee} title="No points earned yet" />
            ) : (
              data.sales.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                      <ArrowDownLeft className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{s.material || 'Purchase'}</p>
                      <p className="truncate text-xs text-slate-500">{s.customerName} · {dateStr(s.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-600">+{num(s.commissionPoints)}</p>
                    <p className="text-xs text-slate-400">{inr(s.amount)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'redeemed' && (
          <div className="divide-y divide-slate-100">
            {data.redemptions.length === 0 ? (
              <EmptyState icon={Gift} title="No gifts claimed yet" subtitle="Earn points, then visit the shop — the owner will deduct points and hand over your gift." />
            ) : (
              data.redemptions.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-500">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{r.giftTitle}</p>
                      <p className="truncate text-xs text-slate-500">{dateStr(r.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="font-semibold text-rose-500">-{num(r.pointsCost)}</p>
                    <Badge tone={statusTone[r.status]}>{r.status}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
