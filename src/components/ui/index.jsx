import { Loader2, X } from 'lucide-react'

export function Spinner({ className = '' }) {
  return <Loader2 className={`animate-spin ${className}`} />
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-slate-500">
      <Spinner className="h-7 w-7 text-brand-600" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

export function StatCard({ icon: Icon, label, value, sub, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-700',
    gold: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    rose: 'bg-rose-50 text-rose-600',
    green: 'bg-emerald-50 text-emerald-600',
  }
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900 sm:text-3xl">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
        </div>
        {Icon && (
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
    </div>
  )
}

export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center">
      {Icon && <Icon className="h-8 w-8 text-slate-300" />}
      <p className="font-medium text-slate-600">{title}</p>
      {subtitle && <p className="max-w-sm text-sm text-slate-400">{subtitle}</p>}
    </div>
  )
}

export function Badge({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600',
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    rose: 'bg-rose-100 text-rose-700',
    blue: 'bg-blue-100 text-blue-700',
    brand: 'bg-brand-100 text-brand-700',
  }
  return <span className={`chip ${tones[tone]}`}>{children}</span>
}

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-md' }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className={`w-full ${maxWidth} animate-[slideUp_.2s_ease-out] rounded-t-3xl bg-white shadow-xl sm:rounded-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-5">{children}</div>
      </div>
      <style>{`@keyframes slideUp{from{transform:translateY(20px);opacity:.6}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  )
}

export function Avatar({ name, src, size = 'h-10 w-10' }) {
  const initials = (name || '?')
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
  if (src) return <img src={src} alt={name} className={`${size} rounded-full object-cover`} />
  return (
    <span className={`${size} grid place-items-center rounded-full bg-brand-600 text-sm font-semibold text-white`}>
      {initials}
    </span>
  )
}
