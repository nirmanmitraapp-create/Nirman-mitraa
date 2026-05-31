import { useEffect, useState } from 'react'
import { Coins, CheckCircle2, Store } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { listGifts } from '../../services/db'
import { SectionHeader, PageLoader, GiftImage } from '../../components/ui/index.jsx'
import { num } from '../../utils/format'

export default function Gifts() {
  const { profile } = useAuth()
  const [gifts, setGifts] = useState(null)

  useEffect(() => {
    listGifts().then((g) => setGifts(g.filter((x) => x.active)))
  }, [])

  if (!gifts) return <PageLoader />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 p-4 text-white shadow-sm">
        <div>
          <p className="text-sm text-amber-50">Your points</p>
          <p className="text-2xl font-extrabold">{num(profile.points)}</p>
        </div>
        <Coins className="h-10 w-10 text-amber-100" />
      </div>

      <SectionHeader title="Rewards catalog" subtitle="Keep earning points and claim gifts at the shop" />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {gifts.map((g) => {
          const pct = g.pointsCost ? Math.min(100, Math.round((profile.points / g.pointsCost) * 100)) : 0
          const ready = profile.points >= g.pointsCost
          const remaining = Math.max(0, g.pointsCost - profile.points)
          return (
            <div key={g.id} className="card flex flex-col overflow-hidden p-4">
              <div className="grid h-24 place-items-center overflow-hidden rounded-xl bg-slate-50 text-5xl"><GiftImage image={g.image} emojiClass="text-5xl" /></div>
              <p className="mt-3 line-clamp-1 font-semibold text-slate-900">{g.title}</p>
              <p className="line-clamp-2 text-xs text-slate-500">{g.description}</p>
              <div className="mt-2 flex items-center gap-1 text-amber-600">
                <Coins className="h-4 w-4" />
                <span className="font-bold">{num(g.pointsCost)}</span>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${ready ? 'bg-emerald-500' : 'bg-brand-600'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {ready ? (
                  <p className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Ready — claim at the shop
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">
                    {num(remaining)} more points · {pct}%
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* How to claim */}
      <div className="card flex items-start gap-3 p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
          <Store className="h-5 w-5" />
        </span>
        <div>
          <p className="font-semibold text-slate-900">How to claim your gift</p>
          <p className="text-sm text-slate-500">
            Once you have enough points, visit the shop. The shop owner will deduct the points and
            hand over your gift.
          </p>
        </div>
      </div>
    </div>
  )
}
