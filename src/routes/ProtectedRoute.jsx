import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PageLoader } from '../components/ui/index.jsx'

export function RequireAuth({ children, adminOnly = false }) {
  const { profile, loading, isAdmin } = useAuth()
  const location = useLocation()

  if (loading) return <PageLoader />
  if (!profile) return <Navigate to="/login" state={{ from: location }} replace />
  if (adminOnly && !isAdmin) return <Navigate to="/app" replace />
  // a logged-in admin landing on a user route is fine; they can use both.
  return children
}
