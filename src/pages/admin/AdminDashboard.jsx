import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Coins, Gift, ReceiptIndianRupee, TrendingUp } from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { getAdminStats } from '../../services/db'
import { StatCard, SectionHeader, PageLoader, Avatar, Badge, EmptyState } from '../../components/ui/index.jsx'
import { num, dateStr } from '../../utils/format'

const PIE_COLORS = ['#0d9488', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#10b981']
const RANGES = [
  { key: '3m', label: '3M', months: 3, full: 'last 3 months' },
  { key: '6m', label: '6M', months: 6, full: 'last 6 months' },
  { key: '12m', label: '12M', months: 12, full: 'last 12 months' },
  { key: 'all', label: 'All', months: null, full: 'all time' },
]

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [range, setRange] = useState('6m')

  useEffect(() => { getAdminStats().then(setStats) }, [])
  if (!stats) return <PageLoader />

  const cfg = RANGES.find((r) => r.key === range)

  // resolve the referring person for a commission record
  const refName = (s) => {
    const u = stats.users.find(
      (x) => (s.userId && x.id === s.userId) || x.referralId?.toUpperCase() === s.referralId?.toUpperCase(),
    )
    return u?.name || s.referralId || 'Direct'
  }

  // how many monthly buckets does the selected range span?
  const now = new Date()
  let monthsCount = cfg.months
  if (monthsCount == null) {
    const earliest = stats.sales.reduce((min, s) => Math.min(min, s.createdAt || now.getTime()), now.getTime())
    const ed = new Date(earliest)
    monthsCount = (now.getFullYear() - ed.getFullYear()) * 12 + (now.getMonth() - ed.getMonth()) + 1
    monthsCount = Math.min(Math.max(monthsCount, 1), 24)
  }
  const includeYear = monthsCount > 12
  const fmt = (d) =>
    d.toLocaleString('en-IN', includeYear ? { month: 'short', year: '2-digit' } : { month: 'short' })

  // commissions within the selected window
  const cutoff = new Date(now.getFullYear(), now.getMonth() - (monthsCount - 1), 1).getTime()
  const windowSales = stats.sales.filter((s) => (s.createdAt || 0) >= cutoff)

  const windowPoints = windowSales.reduce((a, s) => a + (s.commissionPoints || 0), 0)

  // points trend buckets
  const months = {}
  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months[fmt(d)] = 0
  }
  windowSales.forEach((s) => {
    const key = fmt(new Date(s.createdAt))
    if (key in months) months[key] += s.commissionPoints || 0
  })
  const trend = Object.entries(months).map(([month, points]) => ({ month, points }))

  // top earners by points (within window)
  const byUser = {}
  windowSales.forEach((s) => {
    const key = refName(s)
    byUser[key] = (byUser[key] || 0) + (s.commissionPoints || 0)
  })
  const pie = Object.entries(byUser)
    .map(([name, value]) => ({ name, value }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  const recent = windowSales.slice(0, 8)

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Dashboard"
        subtitle="Overview of your loyalty program"
        action={
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  range === r.key ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={Users} tone="blue" label="Active Users" value={num(stats.userCount)} sub="all time" />
        <StatCard icon={ReceiptIndianRupee} tone="green" label="Commissions" value={num(windowSales.length)} sub={cfg.full} />
        <StatCard icon={Coins} tone="gold" label="Points Issued" value={num(windowPoints)} sub={cfg.full} />
        <StatCard icon={Gift} tone="rose" label="Pending Gifts" value={num(stats.pendingRedemptions)} sub="awaiting action" />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="card p-4 sm:p-5 lg:col-span-3">
          <SectionHeader title="Points trend" subtitle={`Issued over the ${cfg.full}`} />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="ptsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip formatter={(v) => [`${num(v)} pts`, 'Points']} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Area type="monotone" dataKey="points" stroke="#f59e0b" strokeWidth={2.5} fill="url(#ptsGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-4 sm:p-5 lg:col-span-2">
          <SectionHeader title="Top earners" subtitle={`Points by referrer · ${cfg.full}`} />
          <div className="h-64">
            {pie.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">No points issued in this period</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pie} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {pie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${num(v)} pts`, 'Points']} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between p-4 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-brand-600" />
            <h3 className="font-bold text-slate-900">Recent commissions</h3>
          </div>
          <Link to="/admin/commissions" className="text-sm font-medium text-brand-700 hover:underline">View all</Link>
        </div>
        {recent.length === 0 ? (
          <div className="px-4 pb-6"><EmptyState icon={Coins} title="No commissions in this period" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-120 text-sm">
              <thead className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Referring person</th>
                  <th className="px-4 py-2.5 font-medium">Referral ID</th>
                  <th className="px-4 py-2.5 text-right font-medium">Points</th>
                  <th className="px-4 py-2.5 text-right font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recent.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={refName(s)} size="h-8 w-8" />
                        <span className="font-medium text-slate-800">{refName(s)}</span>
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
        )}
      </div>
    </div>
  )
}
