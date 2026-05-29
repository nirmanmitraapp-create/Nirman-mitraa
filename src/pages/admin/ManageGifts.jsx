import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Gift, Coins, PackageCheck, HandCoins, Search } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { listGifts, addGift, updateGift, removeGift, listRedemptions, updateRedemption, listUsers, adminGiveGift } from '../../services/db'
import { SectionHeader, PageLoader, Modal, Badge, EmptyState, Avatar } from '../../components/ui/index.jsx'
import { num, timeAgo } from '../../utils/format'

const blank = { title: '', description: '', pointsCost: '', image: '🎁', stock: '', active: true }
const EMOJIS = ['🎁', '🥤', '👕', '🧰', '📱', '⛑️', '🔧', '🎽', '⌚', '🎒', '🪛', '☂️']
const statusTone = { pending: 'amber', approved: 'blue', delivered: 'green', rejected: 'rose' }

export default function ManageGifts() {
  const { profile } = useAuth()
  const [tab, setTab] = useState('catalog')
  const [gifts, setGifts] = useState(null)
  const [redemptions, setRedemptions] = useState(null)
  const [users, setUsers] = useState([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(blank)
  const [busy, setBusy] = useState(false)
  // "give gift to user" flow
  const [giving, setGiving] = useState(null) // gift being handed out
  const [userQuery, setUserQuery] = useState('')
  const [giveErr, setGiveErr] = useState('')
  const [toast, setToast] = useState('')

  const load = () => {
    listGifts().then(setGifts)
    listRedemptions().then(setRedemptions)
    listUsers().then((u) => setUsers(u.filter((x) => x.role !== 'admin')))
  }
  useEffect(() => { load() }, [])
  if (!gifts || !redemptions) return <PageLoader />

  const giveToUser = async (user) => {
    setGiveErr('')
    setBusy(true)
    try {
      await adminGiveGift(user, giving, profile?.name || 'Admin')
      setToast(`Gave "${giving.title}" to ${user.name} · ${num(giving.pointsCost)} pts deducted.`)
      setTimeout(() => setToast(''), 4000)
      setGiving(null)
      setUserQuery('')
      load()
    } catch (e) {
      setGiveErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(userQuery.toLowerCase()) ||
      u.referralId?.toLowerCase().includes(userQuery.toLowerCase()) ||
      u.phone?.includes(userQuery),
  )

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const openNew = () => { setEditing(null); setForm(blank); setOpen(true) }
  const openEdit = (g) => { setEditing(g); setForm({ ...g, pointsCost: String(g.pointsCost), stock: String(g.stock) }); setOpen(true) }

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    if (editing) await updateGift(editing.id, { ...form, pointsCost: Number(form.pointsCost), stock: Number(form.stock) })
    else await addGift(form)
    setBusy(false)
    setOpen(false)
    load()
  }

  const del = async (id) => { await removeGift(id); load() }
  const setStatus = async (id, status) => { await updateRedemption(id, { status }); load() }

  const pendingCount = redemptions.filter((r) => r.status === 'pending').length

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Gifts & Rewards"
        subtitle="Manage the catalog and approve redemptions"
        action={tab === 'catalog' && <button onClick={openNew} className="btn-primary text-sm"><Plus className="h-4 w-4" /> Add Gift</button>}
      />

      <div className="flex gap-2">
        <button onClick={() => setTab('catalog')} className={`chip ${tab === 'catalog' ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
          <Gift className="h-3.5 w-3.5" /> Catalog ({gifts.length})
        </button>
        <button onClick={() => setTab('redemptions')} className={`chip ${tab === 'redemptions' ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
          <PackageCheck className="h-3.5 w-3.5" /> Redemptions {pendingCount > 0 && `(${pendingCount} new)`}
        </button>
      </div>

      {tab === 'catalog' && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {gifts.map((g) => (
            <div key={g.id} className="card flex flex-col p-4">
              <div className="grid h-20 place-items-center rounded-xl bg-slate-50 text-4xl">{g.image}</div>
              <div className="mt-2 flex items-center justify-between">
                <p className="line-clamp-1 font-semibold text-slate-900">{g.title}</p>
                {!g.active && <Badge tone="slate">off</Badge>}
              </div>
              <p className="line-clamp-2 text-xs text-slate-500">{g.description}</p>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 font-bold text-amber-600"><Coins className="h-3.5 w-3.5" />{num(g.pointsCost)}</span>
                <span className="text-slate-400">Stock: {g.stock}</span>
              </div>
              <button onClick={() => { setGiveErr(''); setUserQuery(''); setGiving(g) }} className="btn-primary mt-3 w-full text-xs">
                <HandCoins className="h-3.5 w-3.5" /> Give to user
              </button>
              <div className="mt-2 flex gap-2">
                <button onClick={() => openEdit(g)} className="btn-ghost flex-1 px-2 py-1.5 text-xs"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                <button onClick={() => del(g.id)} className="rounded-xl bg-rose-50 px-2.5 text-rose-500 hover:bg-rose-100"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'redemptions' && (
        redemptions.length === 0 ? (
          <EmptyState icon={PackageCheck} title="No redemptions yet" />
        ) : (
          <div className="space-y-3">
            {redemptions.map((r) => (
              <div key={r.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={r.userId} size="h-10 w-10" />
                  <div>
                    <p className="font-semibold text-slate-900">{r.giftTitle}</p>
                    <p className="text-xs text-slate-500">{num(r.pointsCost)} pts · {timeAgo(r.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={statusTone[r.status]}>{r.status}</Badge>
                  {r.status === 'pending' && (
                    <>
                      <button onClick={() => setStatus(r.id, 'approved')} className="btn-primary px-3 py-1.5 text-xs">Approve</button>
                      <button onClick={() => setStatus(r.id, 'rejected')} className="btn-danger px-3 py-1.5 text-xs">Reject</button>
                    </>
                  )}
                  {r.status === 'approved' && (
                    <button onClick={() => setStatus(r.id, 'delivered')} className="btn-ghost px-3 py-1.5 text-xs">Mark delivered</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit gift' : 'Add gift'}>
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="label">Icon</label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map((e) => (
                <button type="button" key={e} onClick={() => setForm((f) => ({ ...f, image: e }))}
                  className={`grid h-10 w-10 place-items-center rounded-lg text-xl ${form.image === e ? 'bg-brand-100 ring-2 ring-brand-500' : 'bg-slate-100'}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Title</label>
            <input className="input" value={form.title} onChange={set('title')} required />
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" value={form.description} onChange={set('description')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Points cost</label>
              <input className="input" type="number" min="0" value={form.pointsCost} onChange={set('pointsCost')} required />
            </div>
            <div>
              <label className="label">Stock</label>
              <input className="input" type="number" min="0" value={form.stock} onChange={set('stock')} required />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="h-4 w-4 rounded" />
            Active (visible to users)
          </label>
          <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? 'Saving…' : editing ? 'Update gift' : 'Add gift'}</button>
        </form>
      </Modal>

      {/* Give gift to user modal */}
      <Modal open={!!giving} onClose={() => setGiving(null)} title={giving ? `Give "${giving.title}"` : ''}>
        {giving && (
          <div>
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-white text-3xl">{giving.image}</span>
              <div>
                <p className="font-semibold text-slate-900">{giving.title}</p>
                <p className="flex items-center gap-1 text-sm text-amber-600"><Coins className="h-3.5 w-3.5" /> {num(giving.pointsCost)} pts will be deducted</p>
              </div>
            </div>

            <label className="label mt-4">Select the user collecting the gift</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input className="input pl-9" placeholder="Search by name, referral ID, phone…" value={userQuery} onChange={(e) => setUserQuery(e.target.value)} autoFocus />
            </div>

            {giveErr && <p className="mt-3 text-sm text-rose-600">{giveErr}</p>}

            <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
              {filteredUsers.length === 0 && <p className="py-4 text-center text-sm text-slate-400">No matching users.</p>}
              {filteredUsers.map((u) => {
                const enough = (u.points || 0) >= giving.pointsCost
                return (
                  <div key={u.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 p-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar name={u.name} src={u.photoURL} size="h-9 w-9" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">{u.name}</p>
                        <p className={`text-xs ${enough ? 'text-slate-500' : 'text-rose-500'}`}>{num(u.points)} pts available</p>
                      </div>
                    </div>
                    <button disabled={!enough || busy} onClick={() => giveToUser(u)} className="btn-primary px-3 py-1.5 text-xs">
                      {enough ? 'Give & deduct' : 'Low points'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </Modal>

      {toast && (
        <div className="fixed inset-x-4 bottom-6 z-50 mx-auto flex max-w-md items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm text-white shadow-lg">
          <HandCoins className="h-4 w-4 shrink-0" /> {toast}
        </div>
      )}
    </div>
  )
}
