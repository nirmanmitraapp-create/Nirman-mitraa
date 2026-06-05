import { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import { format } from 'date-fns'
import { CalendarDays, X, ChevronLeft, ChevronRight } from 'lucide-react'
import 'react-day-picker/style.css'

const rdpStyles = {
  '--rdp-accent-color': '#f47920',
  '--rdp-accent-background-color': '#fff8f0',
  '--rdp-day-height': '36px',
  '--rdp-day-width': '36px',
  '--rdp-day_button-height': '34px',
  '--rdp-day_button-width': '34px',
}

export function DateRangePicker({ from, to, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const hasRange = from || to
  const label = hasRange
    ? [from && format(from, 'dd MMM yyyy'), to && format(to, 'dd MMM yyyy')]
        .filter(Boolean)
        .join(' → ')
    : null

  const handleSelect = (range) => {
    onChange({ from: range?.from ?? undefined, to: range?.to ?? undefined })
    if (range?.from && range?.to) setOpen(false)
  }

  const clear = (e) => {
    e.stopPropagation()
    onChange({ from: undefined, to: undefined })
  }

  return (
    <div ref={ref} className="relative w-full sm:w-auto">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition sm:w-auto
          ${hasRange
            ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm'
            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
          }`}
      >
        <CalendarDays className="h-4 w-4 shrink-0" />
        <span className={`flex-1 text-left sm:flex-none ${hasRange ? 'font-medium' : ''}`}>
          {label ?? 'Filter by date'}
        </span>
        {hasRange ? (
          <span
            role="button"
            tabIndex={0}
            onClick={clear}
            onKeyDown={(e) => e.key === 'Enter' && clear(e)}
            className="ml-1 rounded p-0.5 hover:bg-brand-100"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        ) : (
          <ChevronLeft className={`h-3.5 w-3.5 rotate-[-90deg] transition-transform ${open ? 'rotate-90' : ''}`} />
        )}
      </button>

      {/* Popover */}
      {open && (
        <div
          className="absolute left-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xl
            sm:left-0 sm:right-auto"
          style={{ minWidth: 280 }}
        >
          <DayPicker
            mode="range"
            selected={{ from, to }}
            onSelect={handleSelect}
            defaultMonth={from ?? new Date()}
            style={rdpStyles}
            navLayout="around"
          />
          {(from || to) && (
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-xs text-slate-500">
                {from && to ? `${format(from, 'dd MMM')} → ${format(to, 'dd MMM yyyy')}` : from ? `From ${format(from, 'dd MMM yyyy')}` : `To ${format(to, 'dd MMM yyyy')}`}
              </span>
              <button
                type="button"
                onClick={() => { onChange({ from: undefined, to: undefined }); setOpen(false) }}
                className="text-xs font-medium text-rose-500 hover:underline"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
