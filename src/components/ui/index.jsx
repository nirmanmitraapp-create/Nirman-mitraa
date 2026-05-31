import { useEffect, useState } from 'react'
import { Loader2, X, ChevronLeft, ChevronRight } from 'lucide-react'

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

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-md', bodyClassName = 'max-h-[75vh] overflow-y-auto' }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className={`w-full ${maxWidth} animate-[slideUp_.2s_ease-out] rounded-t-3xl bg-white shadow-xl sm:rounded-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className={`${bodyClassName} p-5`}>{children}</div>
      </div>
      <style>{`@keyframes slideUp{from{transform:translateY(20px);opacity:.6}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  )
}

// Slice an array into pages. Returns the current page's items plus controls.
// Auto-resets to page 1 when the list shrinks below the current page (e.g. on filter).
export function usePaged(items, pageSize = 10) {
  const [page, setPage] = useState(1)
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  useEffect(() => { if (page > totalPages) setPage(1) }, [page, totalPages])
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize
  const pageItems = items.slice(start, start + pageSize)
  return { page: safePage, setPage, totalPages, pageItems, total, start, pageSize }
}

// Build a compact page list with ellipses, e.g. [1, '…', 4, 5, 6, '…', 12]
function pageList(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const out = [1]
  const lo = Math.max(2, page - 1)
  const hi = Math.min(totalPages - 1, page + 1)
  if (lo > 2) out.push('…')
  for (let i = lo; i <= hi; i++) out.push(i)
  if (hi < totalPages - 1) out.push('…')
  out.push(totalPages)
  return out
}

export function Pagination({ page, totalPages, onChange, total, start, pageSize, label = 'items', className = '' }) {
  if (totalPages <= 1) return null
  const from = start + 1
  const to = Math.min(start + pageSize, total)
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 ${className}`}>
      <p className="text-xs text-slate-400">Showing <b className="text-slate-600">{from}–{to}</b> of {total} {label}</p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40 enabled:hover:bg-slate-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pageList(page, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="px-1.5 text-sm text-slate-300">…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className={`h-8 min-w-8 rounded-lg px-2 text-sm font-medium ${
                p === page ? 'bg-brand-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40 enabled:hover:bg-slate-50"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
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
