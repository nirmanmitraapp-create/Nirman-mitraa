import { useEffect, useRef, useState } from 'react'
import { Send, Trash2, Bell, Users, User, Search, RefreshCw, X, Clock, Filter } from 'lucide-react'
import { listNotifications, addNotification, removeNotification, listUsers } from '../../services/db'
import { SectionHeader, PageLoader, EmptyState, Badge, Pagination, usePaged, Spinner } from '../../components/ui/index.jsx'
import { timeAgo } from '../../utils/format'

const BLANK = { title: '', body: '', audience: 'all', targetUserId: '' }

export default function AdminNotifications() {
  const [items, setItems]         = useState(null)
  const [users, setUsers]         = useState([])
  const [form, setForm]           = useState(BLANK)
  const [busy, setBusy]           = useState(false)
  const [sentId, setSentId]       = useState(null)
  const [pushStatus, setPushStatus] = useState(null)
  const [resendSource, setResendSource] = useState(null) // notification being resent

  // history filters
  const [hq, setHq]               = useState('')
  const [audienceFilt, setAudienceFilt] = useState('all')

  // delete confirmation
  const [deletingId, setDeletingId] = useState(null)

  const formRef = useRef(null)

  const load = () => listNotifications().then(setItems)
  useEffect(() => {
    load()
    listUsers().then((u) => setUsers(u.filter((x) => x.role !== 'admin')))
  }, [])

  const paged = usePaged(
    (items || []).filter((n) => {
      const matchQ = !hq ||
        n.title?.toLowerCase().includes(hq.toLowerCase()) ||
        n.body?.toLowerCase().includes(hq.toLowerCase())
      const matchA = audienceFilt === 'all' || n.audience === audienceFilt
      return matchQ && matchA
    }),
    8,
  )

  if (!items) return <PageLoader />

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const send = async (e) => {
    e.preventDefault()
    setBusy(true)
    setPushStatus(null)
    const result = await addNotification({
      title: form.title,
      body: form.body,
      audience: form.audience,
      targetUserId: form.audience === 'user' ? form.targetUserId : null,
    })
    setBusy(false)
    setPushStatus(result?.push || null)
    setSentId(result?.id || null)
    setResendSource(null)
    setForm(BLANK)
    setTimeout(() => setSentId(null), 3000)
    load()
  }

  const del = async (id) => {
    await removeNotification(id)
    setDeletingId(null)
    load()
  }

  const startResend = (n) => {
    setResendSource(n)
    setForm({
      title: n.title,
      body: n.body,
      audience: n.audience || 'all',
      targetUserId: n.targetUserId || '',
    })
    setPushStatus(null)
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const cancelResend = () => {
    setResendSource(null)
    setForm(BLANK)
    setPushStatus(null)
  }

  const targetUser = users.find((u) => u.id === form.targetUserId)

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Alerts & Notifications"
        subtitle="Compose, send, and manage push notifications to your users"
      />

      <div className="grid gap-5 lg:grid-cols-5">

        {/* ── Compose panel ── */}
        <div ref={formRef} className="lg:col-span-2">
          <form onSubmit={send} className="card space-y-4 p-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50">
                  <Send className="h-4 w-4 text-brand-600" />
                </span>
                <h3 className="font-bold text-slate-900">
                  {resendSource ? 'Resend Notification' : 'Compose New'}
                </h3>
              </div>
              {resendSource && (
                <button
                  type="button"
                  onClick={cancelResend}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
                >
                  <X className="h-3.5 w-3.5" /> Clear
                </button>
              )}
            </div>

            {resendSource && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                <RefreshCw className="h-3.5 w-3.5 shrink-0" />
                Editing a resend — originally sent {timeAgo(resendSource.createdAt)}
              </div>
            )}

            <div>
              <label className="label">Title</label>
              <input
                className="input"
                value={form.title}
                onChange={set('title')}
                placeholder="e.g. Festival bonus!"
                required
              />
            </div>

            <div>
              <label className="label">Message</label>
              <textarea
                className="input resize-none"
                rows={3}
                value={form.body}
                onChange={set('body')}
                placeholder="Write your message…"
                required
              />
            </div>

            <div>
              <label className="label">Audience</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, audience: 'all' }))}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition ${
                    form.audience === 'all'
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Users className="h-4 w-4" /> All users
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, audience: 'user' }))}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition ${
                    form.audience === 'user'
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <User className="h-4 w-4" /> Specific
                </button>
              </div>
            </div>

            {form.audience === 'user' && (
              <div>
                <label className="label">Select User</label>
                <select
                  className="input"
                  value={form.targetUserId}
                  onChange={set('targetUserId')}
                  required
                >
                  <option value="">Select user…</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.referralId})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Preview pill */}
            {form.title && (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="mb-1 text-xs font-medium text-slate-400 uppercase tracking-wide">Preview</p>
                <div className="flex items-start gap-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-600">
                    <Bell className="h-4 w-4 text-white" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{form.title || '—'}</p>
                    <p className="text-xs text-slate-500">{form.body || '—'}</p>
                  </div>
                </div>
                {form.audience === 'user' && targetUser && (
                  <p className="mt-2 text-xs text-slate-400">→ Sending to: <b className="text-slate-600">{targetUser.name}</b></p>
                )}
              </div>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy
                ? <><Spinner className="h-4 w-4" /> Sending…</>
                : sentId
                  ? <><Bell className="h-4 w-4" /> Sent!</>
                  : <><Send className="h-4 w-4" /> {resendSource ? 'Resend Notification' : 'Send Notification'}</>}
            </button>

            {pushStatus && (
              <div className={`rounded-xl border px-3 py-2 text-sm ${
                pushStatus.ok
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}>
                {pushStatus.ok
                  ? pushStatus.sent > 0
                    ? `Push delivered to ${pushStatus.sent} device${pushStatus.sent === 1 ? '' : 's'}.`
                    : 'Saved. No devices have push enabled yet — users must allow notifications first.'
                  : `Push failed: ${pushStatus.error}`}
              </div>
            )}
          </form>
        </div>

        {/* ── History panel ── */}
        <div className="space-y-3 lg:col-span-3">
          {/* Header + filters */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100">
                  <Clock className="h-4 w-4 text-slate-500" />
                </span>
                <h3 className="font-bold text-slate-900">Alert History</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  {items.length}
                </span>
              </div>
              <button
                onClick={load}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-9 text-sm"
                placeholder="Search by title or message…"
                value={hq}
                onChange={(e) => setHq(e.target.value)}
              />
              {hq && (
                <button
                  onClick={() => setHq('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Audience filter chips */}
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              {[
                { label: 'All alerts', value: '' },
                { label: 'Broadcast', value: 'all' },
                { label: 'Specific user', value: 'user' },
              ].map((chip) => (
                <button
                  key={chip.value}
                  onClick={() => setAudienceFilt(chip.value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    audienceFilt === chip.value
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notification list */}
          {paged.pageItems.length === 0 ? (
            <EmptyState icon={Bell} title="No alerts found" subtitle="Try adjusting your filters or send a new notification." />
          ) : (
            <div className="space-y-2">
              {paged.pageItems.map((n) => (
                <NotifCard
                  key={n.id}
                  n={n}
                  users={users}
                  onResend={() => startResend(n)}
                  deletingId={deletingId}
                  onDeleteClick={() => setDeletingId(n.id)}
                  onDeleteConfirm={() => del(n.id)}
                  onDeleteCancel={() => setDeletingId(null)}
                  isResendSource={resendSource?.id === n.id}
                />
              ))}
              <Pagination {...paged} onChange={paged.setPage} label="alerts" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function NotifCard({ n, users, onResend, deletingId, onDeleteClick, onDeleteConfirm, onDeleteCancel, isResendSource }) {
  const targetUser = n.audience === 'user' ? users.find((u) => u.id === n.targetUserId) : null
  const isDeleting = deletingId === n.id

  return (
    <div className={`card overflow-hidden transition ${isResendSource ? 'ring-2 ring-brand-400' : ''}`}>
      {isDeleting ? (
        <div className="flex items-center justify-between gap-3 bg-rose-50 px-4 py-3">
          <p className="text-sm font-medium text-rose-800">Delete this alert?</p>
          <div className="flex gap-2">
            <button
              onClick={onDeleteCancel}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={onDeleteConfirm}
              className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-700"
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3 p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
            <Bell className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">{n.title}</p>
                <p className="mt-0.5 text-sm text-slate-600 line-clamp-2">{n.body}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={onResend}
                  title="Resend"
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 transition"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Resend
                </button>
                <button
                  onClick={onDeleteClick}
                  title="Delete"
                  className="rounded-lg p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone={n.audience === 'all' ? 'blue' : 'brand'}>
                {n.audience === 'all' ? <><Users className="h-3 w-3" /> Broadcast</> : <><User className="h-3 w-3" /> {targetUser?.name || 'Specific'}</>}
              </Badge>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="h-3 w-3" /> {timeAgo(n.createdAt)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
