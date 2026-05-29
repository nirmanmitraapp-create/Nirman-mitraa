import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, IndianRupee, Coins, Copy, Check, Share2, TrendingUp, ReceiptIndianRupee } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid } from 'recharts'
import { useAuth } from '../../context/AuthContext'
import { listSalesByUser } from '../../services/db'
import { StatCard, SectionHeader, EmptyState, PageLoader } from '../../components/ui/index.jsx'
import { inr, num, dateStr, timeAgo } from '../../utils/format'

export default function Dashboard() {
  const { profile } = useAuth()
  const [sales, setSales] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (profile) listSalesByUser(profile.id, profile.referralId).then(setSales)
  }, [profile])

  if (!sales) return <PageLoader />

  const referrals = new Set(sales.map((s) => s.customerPhone || s.customerName)).size
  const salesTotal = sales.reduce((a, s) => a + (s.amount || 0), 0)

  // last 6 months chart
  const months = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    months[d.toLocaleString('en-IN', { month: 'short' })] = 0
  }
  sales.forEach((s) => {
    const m = new Date(s.createdAt).toLocaleString('en-IN', { month: 'short' })
    if (m in months) months[m] += s.commissionPoints || 0
  })
  const chartData = Object.entries(months).map(([month, points]) => ({ month, points }))

  const copyReferral = () => {
    navigator.clipboard?.writeText(profile.referralId)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const share = () => {
    const text = `Use my referral ID ${profile.referralId} at the shop and I'll earn rewards! 🏗️`
    if (navigator.share) navigator.share({ title: 'Mistri Rewards', text }).catch(() => {})
    else copyReferral()
  }

  return (
    <div className="space-y-5">
      {/* Referral ID card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 p-5 text-white shadow-lg sm:p-6">
        <div className="relative z-10">
          <p className="text-sm text-brand-100">Your Referral ID</p>
          <div className="mt-1 flex items-center gap-3">
            <p className="text-3xl font-extrabold tracking-wide sm:text-4xl">{profile.referralId}</p>
            <button onClick={copyReferral} className="rounded-lg bg-white/15 p-2 hover:bg-white/25" title="Copy">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-2 max-w-md text-sm text-brand-100">
            Share this ID with customers. When they buy at the shop, you earn commission points.
          </p>
          <button onClick={share} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50">
            <Share2 className="h-4 w-4" /> Share my ID
          </button>
        </div>
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-16 right-16 h-40 w-40 rounded-full bg-white/5" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={Coins} tone="gold" label="Points Balance" value={num(profile.points)} sub="redeemable" />
        <StatCard icon={TrendingUp} tone="green" label="Total Earned" value={num(profile.totalEarned)} sub="all-time points" />
        <StatCard icon={Users} tone="blue" label="Referrals" value={num(referrals)} sub="customers brought" />
        <StatCard icon={IndianRupee} tone="brand" label="Sales Generated" value={inr(salesTotal)} sub={`${sales.length} purchases`} />
      </div>

      {/* Performance chart */}
      <div className="card p-4 sm:p-5">
        <SectionHeader title="Commission performance" subtitle="Points earned over the last 6 months" />
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Bar dataKey="points" fill="#0d9488" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent sales */}
      <div>
        <SectionHeader
          title="Recent sales"
          subtitle="Purchases linked to your referral ID"
          action={<Link to="/app/wallet" className="text-sm font-medium text-brand-700 hover:underline">View all</Link>}
        />
        {sales.length === 0 ? (
          <EmptyState icon={ReceiptIndianRupee} title="No sales yet" subtitle="Share your referral ID with customers to start earning." />
        ) : (
          <div className="card divide-y divide-slate-100">
            {sales.slice(0, 6).map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{s.customerName || 'Customer'}</p>
                  <p className="truncate text-xs text-slate-500">{s.material || 'Purchase'} · {dateStr(s.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-emerald-600">+{num(s.commissionPoints)} pts</p>
                  <p className="text-xs text-slate-400">{inr(s.amount)} · {timeAgo(s.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
