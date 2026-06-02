import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, ShieldCheck, ArrowRight, Smartphone, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
// import { GoogleIcon } from './GoogleIcon' // TODO: re-enable Google sign-in when needed
import { Spinner } from '../components/ui/index.jsx'

export default function Login() {
  const { profile, isAdmin, isDemo, login, /* loginWithGoogle, */ demoLoginAs } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  // redirect once logged in
  useEffect(() => {
    if (profile) navigate(isAdmin ? '/admin' : '/app', { replace: true })
  }, [profile, isAdmin, navigate])

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    if (!/\S+@\S+\.\S+/.test(form.email)) return setErr('Enter a valid email address.')
    if (form.password.length < 6) return setErr('Password must be at least 6 characters.')
    setBusy(true)
    try {
      await login({ email: form.email, password: form.password })
    } catch (e2) {
      setErr(friendly(e2))
    } finally {
      setBusy(false)
    }
  }

  // TODO: re-enable Google sign-in when needed
  // const google = async () => {
  //   setErr('')
  //   setBusy(true)
  //   try {
  //     await loginWithGoogle()
  //   } catch (e2) {
  //     setErr(friendly(e2))
  //   } finally {
  //     setBusy(false)
  //   }
  // }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-700 p-10 text-white lg:flex">
        <div className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 text-xl">🏗️</span>
          <span className="text-lg font-bold">Mistri Rewards</span>
        </div>
        <div>
          <h1 className="text-4xl font-extrabold leading-tight">Refer. Sell. Earn rewards.</h1>
          <p className="mt-4 max-w-md text-brand-100">
            The loyalty program for Mistris &amp; Contractors. Bring customers to the shop, earn
            commission points on every purchase, and redeem exciting gifts.
          </p>
          <ul className="mt-8 space-y-3 text-brand-50">
            <li className="flex items-center gap-3"><ShieldCheck className="h-5 w-5" /> Secure email &amp; Google login</li>
            <li className="flex items-center gap-3"><Smartphone className="h-5 w-5" /> Track sales &amp; commission live</li>
            <li className="flex items-center gap-3"><ArrowRight className="h-5 w-5" /> Climb the leaderboard</li>
          </ul>
        </div>
        <p className="text-xs text-brand-200">© {new Date().getFullYear()} Mistri Rewards</p>
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-80 w-80 rounded-full bg-brand-600/40" />
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-slate-50 p-5 sm:p-8">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center lg:hidden">
            <span className="mb-3 inline-grid h-14 w-14 place-items-center rounded-2xl bg-brand-700 text-2xl">🏗️</span>
            <h1 className="text-2xl font-extrabold text-slate-900">Mistri Rewards</h1>
            <p className="text-sm text-slate-500">Loyalty program for Mistris &amp; Contractors</p>
          </div>

          {isDemo && (
            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
              <b>Demo mode</b> — no Firebase configured. Use a quick login below or enter your credentials.
              (Admin: <b>owner@shop.com</b> / <b>admin123</b>)
            </div>
          )}

          <div className="card p-6">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-900">Welcome back</h2>
              <p className="mt-1 text-sm text-slate-500">Sign in to your account</p>
            </div>

            <form onSubmit={submit}>
              <label className="label">Email</label>
              <Field icon={Mail}>
                <input
                  type="email"
                  autoComplete="email"
                  className="w-full bg-transparent py-2.5 text-sm outline-none"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={set('email')}
                />
              </Field>

              <label className="label mt-4">Password</label>
              <Field icon={Lock}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="w-full bg-transparent py-2.5 text-sm outline-none"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={set('password')}
                />
                <button type="button" onClick={() => setShowPwd((s) => !s)} className="text-slate-400 hover:text-slate-600">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </Field>

              {err && <p className="mt-3 text-sm text-rose-600">{err}</p>}

              <button type="submit" disabled={busy} className="btn-primary mt-5 w-full">
                {busy ? <Spinner className="h-4 w-4" /> : 'Login'}
                {!busy && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            {/* TODO: re-enable Google sign-in when needed */}
            {/* <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200" /> OR <span className="h-px flex-1 bg-slate-200" />
            </div>
            <button onClick={google} disabled={busy} className="btn-ghost w-full border border-slate-200 bg-white hover:bg-slate-50">
              <GoogleIcon /> Continue with Google
            </button> */}
          </div>

          {isDemo && (
            <div className="mt-5">
              <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-slate-400">Quick demo login</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => demoLoginAs('u_ramesh')} className="btn-ghost text-xs">👷 Mistri (Ramesh)</button>
                <button onClick={() => demoLoginAs('u_admin')} className="btn-ghost text-xs">🛠️ Admin (Owner)</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/30">
      <Icon className="h-4 w-4 shrink-0 text-slate-400" />
      {children}
    </div>
  )
}

// TODO: re-enable when Google sign-in is needed
// function GoogleIcon() { ... }

function friendly(e) {
  const code = e?.code || ''
  const map = {
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/user-not-found': 'No account found with this email.',
    // 'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    // 'auth/operation-not-allowed': 'This sign-in method is not enabled.',
  }
  return map[code] || e?.message || 'Something went wrong. Please try again.'
}
