import { useEffect, useState } from 'react'
import { Send, Trash2, Bell, Users, User } from 'lucide-react'
import { listNotifications, addNotification, removeNotification, listUsers } from '../../services/db'
import { SectionHeader, PageLoader, EmptyState, Badge } from '../../components/ui/index.jsx'
import { timeAgo } from '../../utils/format'

export default function AdminNotifications() {
  const [items, setItems] = useState(null)
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ title: '', body: '', audience: 'all', targetUserId: '' })
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [pushStatus, setPushStatus] = useState(null)

  const load = () => listNotifications().then(setItems)
  useEffect(() => {
    load()
    listUsers().then((u) => setUsers(u.filter((x) => x.role !== 'admin')))
  }, [])
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
    setForm({ title: '', body: '', audience: 'all', targetUserId: '' })
    setSent(true)
    setTimeout(() => setSent(false), 2500)
    load()
  }

  const del = async (id) => { await removeNotification(id); load() }

  return (
    <div className="space-y-5">
      <SectionHeader title="Notification Management" subtitle="Broadcast updates to users (also delivers via push when Firebase Cloud Messaging is configured)" />

      <div className="grid gap-5 lg:grid-cols-5">
        <form onSubmit={send} className="card space-y-3 p-5 lg:col-span-2">
          <h3 className="font-bold text-slate-900">Compose</h3>
          <div>
            <label className="label">Title</label>
            <input className="input" value={form.title} onChange={set('title')} placeholder="e.g. Festival bonus!" required />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea className="input" rows={3} value={form.body} onChange={set('body')} placeholder="Write your message…" required />
          </div>
          <div>
            <label className="label">Audience</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setForm((f) => ({ ...f, audience: 'all' }))}
                className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium ${form.audience === 'all' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'}`}>
                <Users className="h-4 w-4" /> All users
              </button>
              <button type="button" onClick={() => setForm((f) => ({ ...f, audience: 'user' }))}
                className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium ${form.audience === 'user' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'}`}>
                <User className="h-4 w-4" /> Specific
              </button>
            </div>
          </div>
          {form.audience === 'user' && (
            <select className="input" value={form.targetUserId} onChange={set('targetUserId')} required>
              <option value="">Select user…</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.referralId})</option>)}
            </select>
          )}
          <button type="submit" disabled={busy} className="btn-primary w-full">
            <Send className="h-4 w-4" /> {busy ? 'Sending…' : sent ? 'Sent!' : 'Send notification'}
          </button>
          {pushStatus && (
            <div className={`rounded-xl border px-3 py-2 text-sm ${pushStatus.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
              {pushStatus.ok
                ? pushStatus.sent > 0
                  ? `📲 Background push delivered to ${pushStatus.sent} device${pushStatus.sent === 1 ? '' : 's'}.`
                  : '⚠️ Saved, but 0 devices had a push token. Open the user app on a phone and allow notifications first.'
                : `❌ Push failed: ${pushStatus.error}${pushStatus.status ? ` (HTTP ${pushStatus.status})` : ''}`}
            </div>
          )}
        </form>

        <div className="lg:col-span-3">
          <h3 className="mb-3 font-bold text-slate-900">Sent notifications</h3>
          {items.length === 0 ? (
            <EmptyState icon={Bell} title="Nothing sent yet" />
          ) : (
            <div className="space-y-3">
              {items.map((n) => (
                <div key={n.id} className="card flex gap-3 p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600"><Bell className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900">{n.title}</p>
                      <button onClick={() => del(n.id)} className="rounded-lg p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-500"><Trash2 className="h-4 w-4" /></button>
                    </div>
                    <p className="text-sm text-slate-600">{n.body}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Badge tone={n.audience === 'all' ? 'blue' : 'brand'}>{n.audience === 'all' ? 'All users' : 'Specific'}</Badge>
                      <span className="text-xs text-slate-400">{timeAgo(n.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
