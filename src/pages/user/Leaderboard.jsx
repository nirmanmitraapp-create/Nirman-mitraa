import { useEffect, useState } from 'react'
import { Trophy, Crown, Medal, TrendingUp } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getLeaderboard } from '../../services/db'
import { SectionHeader, PageLoader, Avatar, EmptyState } from '../../components/ui/index.jsx'
import { num, inr } from '../../utils/format'

export default function Leaderboard() {
  const { profile } = useAuth()
  const [rows, setRows] = useState(null)

  useEffect(() => { getLeaderboard().then(setRows) }, [])
  if (!rows) return <PageLoader />

  if (rows.length === 0) {
    return (
      <div className="space-y-5">
        <SectionHeader title="Leaderboard" subtitle="Top performers by points earned" />
        <EmptyState icon={Trophy} title="No rankings yet" subtitle="Earn points to appear on the leaderboard." />
      </div>
    )
  }

  const [first, second, third] = rows
  const myIndex = rows.findIndex((r) => r.id === profile?.id)

  return (
    <div className="space-y-5">
      <SectionHeader title="Leaderboard" subtitle="Top performers by points earned" />

      {/* Podium */}
      <div className="rounded-2xl bg-gradient-to-b from-brand-700 to-brand-800 px-3 pb-0 pt-6 shadow-lg">
        <div className="flex items-end justify-center gap-2 sm:gap-4">
          <PodiumColumn user={second} place={2} />
          <PodiumColumn user={first} place={1} />
          <PodiumColumn user={third} place={3} />
        </div>
      </div>

      {/* Your rank */}
      {myIndex >= 0 && (
        <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-brand-200">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-700 font-bold text-white">#{myIndex + 1}</span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Your rank</p>
              <p className="font-semibold text-slate-900">{profile.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-extrabold text-amber-600">{num(profile.totalEarned)}</p>
            <p className="text-xs text-slate-400">points</p>
          </div>
        </div>
      )}

      {/* Full standings */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
          <TrendingUp className="h-5 w-5 text-brand-600" /> All rankings
        </h3>
        <div className="card divide-y divide-slate-100">
          {rows.map((r, i) => {
            const me = r.id === profile?.id
            return (
              <div key={r.id} className={`flex items-center gap-3 p-3.5 ${me ? 'bg-brand-50' : ''}`}>
                <RankBadge rank={i + 1} />
                <Avatar name={r.name} src={r.photoURL} size="h-10 w-10" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">
                    {r.name} {me && <span className="text-xs font-normal text-brand-600">(You)</span>}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {r.trade || 'Mistri'} · {num(r.referralCount)} referrals · {inr(r.salesTotal)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-amber-600">{num(r.totalEarned)}</p>
                  <p className="text-[11px] text-slate-400">pts</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ---- podium column ---- */
function PodiumColumn({ user, place }) {
  if (!user) return <div className="w-1/4 sm:w-28" /> // keep #1 centered

  const cfg = {
    1: { h: 'h-28 sm:h-32', grad: 'from-amber-300 to-amber-500', ring: 'ring-amber-300', av: 'h-16 w-16 sm:h-20 sm:w-20', text: 'text-amber-50' },
    2: { h: 'h-20 sm:h-24', grad: 'from-slate-200 to-slate-400', ring: 'ring-slate-300', av: 'h-12 w-12 sm:h-16 sm:w-16', text: 'text-slate-50' },
    3: { h: 'h-16 sm:h-20', grad: 'from-orange-300 to-orange-500', ring: 'ring-orange-300', av: 'h-12 w-12 sm:h-16 sm:w-16', text: 'text-orange-50' },
  }[place]

  return (
    <div className="flex w-1/4 flex-col items-center sm:w-28">
      {place === 1 && <Crown className="mb-1 h-6 w-6 text-amber-300 drop-shadow" />}
      <div className={`relative rounded-full ring-4 ${cfg.ring}`}>
        <Avatar name={user.name} src={user.photoURL} size={cfg.av} />
      </div>
      <p className="mt-2 line-clamp-1 max-w-full text-center text-xs font-semibold text-white">{user.name}</p>
      <p className="text-[11px] font-bold text-amber-200">{num(user.totalEarned)} pts</p>
      <div className={`mt-2 flex w-full items-start justify-center rounded-t-xl bg-gradient-to-b ${cfg.grad} ${cfg.h} pt-2`}>
        <span className={`text-2xl font-extrabold ${cfg.text} drop-shadow`}>{place}</span>
      </div>
    </div>
  )
}

/* ---- rank badge for list rows ---- */
function RankBadge({ rank }) {
  if (rank <= 3) {
    const tone = { 1: 'bg-amber-100 text-amber-600', 2: 'bg-slate-100 text-slate-500', 3: 'bg-orange-100 text-orange-600' }[rank]
    return (
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${tone}`}>
        <Medal className="h-4 w-4" />
      </span>
    )
  }
  return <span className="w-8 shrink-0 text-center font-bold text-slate-400">{rank}</span>
}
