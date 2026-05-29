import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { listNotificationsForUser } from '../../services/db'
import { SectionHeader, PageLoader, EmptyState } from '../../components/ui/index.jsx'
import { timeAgo } from '../../utils/format'

export default function Notifications() {
  const { profile } = useAuth()
  const [items, setItems] = useState(null)

  useEffect(() => {
    if (profile) listNotificationsForUser(profile.id).then(setItems)
  }, [profile])

  if (!items) return <PageLoader />

  return (
    <div className="space-y-5">
      <SectionHeader title="Notifications" subtitle="Updates from the shop" />
      {items.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" subtitle="You're all caught up." />
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <div key={n.id} className="card flex gap-3 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
                <Bell className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">{n.title}</p>
                  <span className="shrink-0 text-xs text-slate-400">{timeAgo(n.createdAt)}</span>
                </div>
                <p className="mt-0.5 text-sm text-slate-600">{n.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
