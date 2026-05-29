import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, IndianRupee, Coins, Gift, Wallet2, ReceiptIndianRupee, TrendingUp,
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { getAdminStats } from '../../services/db'
import { StatCard, SectionHeader, PageLoader } from '../../components/ui/index.jsx'
import { inr, num, dateStr } from '../../utils/format'

const PIE_COLORS = ['#0d9488', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#10b981']

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)

  useEffect(() => { getAdminStats().then(setStats) }, [])
  if (!stats) return <PageLoader />

  // sales trend (last 6 months)
  const months = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    months[d.toLocaleString('en-IN', { month: 'short' })] = 0
  }
  stats.sales.forEach((s) => {
    const m = new Date(s.createdAt).toLocaleString('en-IN', { month: 'short' })
    if (m in months) months[m] += s.amount || 0
  })
  const trend = Object.entries(months).map(([month, sales]) => ({ month, sales }))

  // top contributors pie
  const byUser = {}
  stats.sales.forEach((s) => {
    const key = s.referralId || 'Direct'
    byUser[key] = (byUser[key] || 0) + (s.amount || 0)
  })
  const pie = Object.entries(byUser)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Dashboard"
        subtitle="Overview of your loyalty program"
        action={<Link to="/admin/record-sale" className="btn-primary text-sm"><ReceiptIndianRupee className="h-4 w-4" /> Record Sale</Link>}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={IndianRupee} tone="brand" label="Total Sales" value={inr(stats.totalSales)} />
        <StatCard icon={Users} tone="blue" label="Active Users" value={num(stats.userCount)} />
        <StatCard icon={ReceiptIndianRupee} tone="green" label="Transactions" value={num(stats.salesCount)} />
        <StatCard icon={Coins} tone="gold" label="Points Issued" value={num(stats.totalPoints)} />
        <StatCard icon={Gift} tone="rose" label="Pending Gifts" value={num(stats.pendingRedemptions)} />
        <StatCard icon={Wallet2} tone="rose" label="Outstanding Due" value={inr(stats.outstandingDue)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="card p-4 sm:p-5 lg:col-span-3">
          <SectionHeader title="Sales trend" subtitle="Last 6 months" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(v) => inr(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Area type="monotone" dataKey="sales" stroke="#0d9488" strokeWidth={2.5} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-4 sm:p-5 lg:col-span-2">
          <SectionHeader title="Top contributors" subtitle="Sales by referral" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pie} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                  {pie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => inr(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between p-4 pb-2">
          <h3 className="font-bold text-slate-900">Recent sales</h3>
          <Link to="/admin/commissions" className="text-sm font-medium text-brand-700 hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">Customer</th>
                <th className="px-4 py-2 font-medium">Referral</th>
                <th className="px-4 py-2 font-medium">Material</th>
                <th className="px-4 py-2 text-right font-medium">Amount</th>
                <th className="px-4 py-2 text-right font-medium">Points</th>
                <th className="px-4 py-2 text-right font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {stats.sales.slice(0, 8).map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-800">{s.customerName}</td>
                  <td className="px-4 py-2.5"><span className="chip bg-brand-50 text-brand-700">{s.referralId || '—'}</span></td>
                  <td className="px-4 py-2.5 text-slate-500">{s.material}</td>
                  <td className="px-4 py-2.5 text-right font-medium">{inr(s.amount)}</td>
                  <td className="px-4 py-2.5 text-right text-emerald-600">+{num(s.commissionPoints)}</td>
                  <td className="px-4 py-2.5 text-right text-slate-400">{dateStr(s.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
