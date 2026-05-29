import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, User, ShieldCheck, ArrowRight, Smartphone, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Spinner } from '../components/ui/index.jsx'

const TRADES = ['Mason', 'Plumber', 'Electrician', 'Contractor', 'Painter', 'Carpenter', 'Other']

export default function Login() {
  const { profile, isAdmin, isDemo, login, signUp, loginWithGoogle, demoLoginAs } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState('login') // login | signup
  const [form, setForm] = useState({ name: '', email: '', password: '', trade: 'Mason', city: '' })
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
    if (mode === 'signup' && !form.name.trim()) return setErr('Please enter your name.')

    setBusy(true)
    try {
      if (mode === 'signup') await signUp(form)
      else await login({ email: form.email, password: form.password })
      // redirect handled by effect
    } catch (e2) {
      setErr(friendly(e2))
    } finally {
      setBusy(false)
    }
  }

  const google = async () => {
    setErr('')
    setBusy(true)
    try {
      await loginWithGoogle()
    } catch (e2) {
      setErr(friendly(e2))
    } finally {
      setBusy(false)
    }
  }

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
              <b>Demo mode</b> — no Firebase configured. Sign up with any email/password, or use a
              quick login below. (Admin demo: <b>owner@shop.com</b> / <b>admin123</b>)
            </div>
          )}

          <div className="card p-6">
            {/* Tabs */}
            <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
              {['login', 'signup'].map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setErr('') }}
                  className={`rounded-lg py-2 text-sm font-semibold transition ${
                    mode === m ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  {m === 'login' ? 'Login' : 'Sign Up'}
                </button>
              ))}
            </div>

            <form onSubmit={submit}>
              {mode === 'signup' && (
                <>
                  <label className="label">Full name</label>
                  <Field icon={User}>
                    <input className="w-full bg-transparent py-2.5 text-sm outline-none" placeholder="Your name" value={form.name} onChange={set('name')} />
                  </Field>
                </>
              )}

              <label className="label mt-4">Email</label>
              <Field icon={Mail}>
                <input type="email" autoComplete="email" className="w-full bg-transparent py-2.5 text-sm outline-none" placeholder="you@example.com" value={form.email} onChange={set('email')} />
              </Field>

              <label className="label mt-4">Password</label>
              <Field icon={Lock}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  className="w-full bg-transparent py-2.5 text-sm outline-none"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={set('password')}
                />
                <button type="button" onClick={() => setShowPwd((s) => !s)} className="text-slate-400 hover:text-slate-600">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </Field>

              {mode === 'signup' && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div>
                    <label className="label">Trade</label>
                    <select className="input" value={form.trade} onChange={set('trade')}>
                      {TRADES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">City</label>
                    <input className="input" placeholder="City" value={form.city} onChange={set('city')} />
                  </div>
                </div>
              )}

              {err && <p className="mt-3 text-sm text-rose-600">{err}</p>}

              <button type="submit" disabled={busy} className="btn-primary mt-5 w-full">
                {busy ? <Spinner className="h-4 w-4" /> : mode === 'signup' ? 'Create account' : 'Login'}
                {!busy && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            {/* divider */}
            <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200" /> OR <span className="h-px flex-1 bg-slate-200" />
            </div>

            <button onClick={google} disabled={busy} className="btn-ghost w-full border border-slate-200 bg-white hover:bg-slate-50">
              <GoogleIcon /> Continue with Google
            </button>
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

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 5.1 29.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 7.1 29.5 5 24 5 16 5 9.1 9.5 6.3 14.7z" transform="translate(0 -2)" />
      <path fill="#4CAF50" d="M24 45c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.2 36 26.7 37 24 37c-5.3 0-9.7-2.6-11.3-7l-6.5 5C9 41.4 15.9 45 24 45z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.6l6.3 5.2C40.9 35.6 44 30.4 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  )
}

function friendly(e) {
  const code = e?.code || ''
  const map = {
    'auth/email-already-in-use': 'This email is already registered. Try logging in.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled in Firebase.',
  }
  return map[code] || e?.message || 'Something went wrong. Please try again.'
}
