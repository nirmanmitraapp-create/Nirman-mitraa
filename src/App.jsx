import { Routes, Route, Navigate } from 'react-router-dom'
import { RequireAuth } from './routes/ProtectedRoute'

import Login from './pages/Login'

import UserLayout from './components/layout/UserLayout'
import Dashboard from './pages/user/Dashboard'
import Wallet from './pages/user/Wallet'
import Gifts from './pages/user/Gifts'
import Leaderboard from './pages/user/Leaderboard'
import Profile from './pages/user/Profile'
import Notifications from './pages/user/Notifications'

import AdminLayout from './components/layout/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import ManageUsers from './pages/admin/ManageUsers'
import Commissions from './pages/admin/Commissions'
import ManageGifts from './pages/admin/ManageGifts'
import AdminNotifications from './pages/admin/AdminNotifications'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* User app */}
      <Route
        path="/app"
        element={
          <RequireAuth>
            <UserLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="wallet" element={<Wallet />} />
        <Route path="gifts" element={<Gifts />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      {/* Admin panel */}
      <Route
        path="/admin"
        element={
          <RequireAuth adminOnly>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="commissions" element={<Commissions />} />
        <Route path="gifts" element={<ManageGifts />} />
        <Route path="notifications" element={<AdminNotifications />} />
      </Route>

      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  )
}
