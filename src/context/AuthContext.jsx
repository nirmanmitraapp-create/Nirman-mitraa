import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { isFirebaseConfigured, auth, isAdminEmail } from '../firebase/config'
import { getUserByUid, getUserByEmail, createUser, updateUser } from '../services/db'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

const DEMO_SESSION_KEY = 'mistri_demo_uid'

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null) // our app user record
  const [loading, setLoading] = useState(true)

  // --- bootstrap session ---------------------------------------------------
  useEffect(() => {
    let unsub = () => {}
    async function boot() {
      if (isFirebaseConfigured) {
        const { onAuthStateChanged } = await import('firebase/auth')
        unsub = onAuthStateChanged(auth, async (fbUser) => {
          if (fbUser) {
            let rec = await getUserByUid(fbUser.uid)
            if (!rec) {
              const email = fbUser.email || ''
              rec = await createUser(fbUser.uid, {
                email,
                name: fbUser.displayName || email.split('@')[0] || '',
                photoURL: fbUser.photoURL || '',
                role: isAdminEmail(email) ? 'admin' : 'user',
              })
            }
            setProfile(rec)
          } else {
            setProfile(null)
          }
          setLoading(false)
        })
      } else {
        // demo: restore from localStorage
        const savedUid = localStorage.getItem(DEMO_SESSION_KEY)
        if (savedUid) {
          const rec = await getUserByUid(savedUid)
          setProfile(rec)
        }
        setLoading(false)
      }
    }
    boot()
    return () => unsub()
  }, [])

  // --- email + password sign up -------------------------------------------
  const signUp = useCallback(async ({ name, email, password, trade, city }) => {
    const cleanEmail = String(email).trim().toLowerCase()

    if (!isFirebaseConfigured) {
      const existing = await getUserByEmail(cleanEmail)
      if (existing) throw new Error('An account with this email already exists. Please log in.')
      const demoUid = 'demo_' + cleanEmail.replace(/[^a-z0-9]/g, '')
      const rec = await createUser(demoUid, {
        email: cleanEmail, password, name, trade, city,
        role: isAdminEmail(cleanEmail) ? 'admin' : 'user',
      })
      localStorage.setItem(DEMO_SESSION_KEY, rec.uid)
      setProfile(rec)
      return rec
    }

    const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth')
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password)
    if (name) await updateProfile(cred.user, { displayName: name }).catch(() => {})
    const rec = await createUser(cred.user.uid, {
      email: cleanEmail, name, trade, city,
      role: isAdminEmail(cleanEmail) ? 'admin' : 'user',
    })
    setProfile(rec)
    return rec
  }, [])

  // --- email + password login ---------------------------------------------
  const login = useCallback(async ({ email, password }) => {
    const cleanEmail = String(email).trim().toLowerCase()

    if (!isFirebaseConfigured) {
      const rec = await getUserByEmail(cleanEmail)
      if (!rec) throw new Error('No account found with this email. Please sign up.')
      if (rec.password && rec.password !== password) throw new Error('Incorrect password.')
      localStorage.setItem(DEMO_SESSION_KEY, rec.uid)
      setProfile(rec)
      return rec
    }

    const { signInWithEmailAndPassword } = await import('firebase/auth')
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, password)
    let rec = await getUserByUid(cred.user.uid)
    if (!rec) {
      rec = await createUser(cred.user.uid, {
        email: cleanEmail,
        name: cred.user.displayName || cleanEmail.split('@')[0],
        role: isAdminEmail(cleanEmail) ? 'admin' : 'user',
      })
    }
    setProfile(rec)
    return rec
  }, [])

  // --- continue with Google -----------------------------------------------
  const loginWithGoogle = useCallback(async () => {
    if (!isFirebaseConfigured) {
      // demo: simulate a Google account
      const email = 'google.user@demo.com'
      let rec = await getUserByEmail(email)
      if (!rec) {
        rec = await createUser('demo_google', {
          email, name: 'Google User', photoURL: '',
          role: isAdminEmail(email) ? 'admin' : 'user',
        })
      }
      localStorage.setItem(DEMO_SESSION_KEY, rec.uid)
      setProfile(rec)
      return rec
    }

    const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth')
    const provider = new GoogleAuthProvider()
    const cred = await signInWithPopup(auth, provider)
    const fbUser = cred.user
    let rec = await getUserByUid(fbUser.uid)
    if (!rec) {
      const email = fbUser.email || ''
      rec = await createUser(fbUser.uid, {
        email,
        name: fbUser.displayName || email.split('@')[0],
        photoURL: fbUser.photoURL || '',
        role: isAdminEmail(email) ? 'admin' : 'user',
      })
    }
    setProfile(rec)
    return rec
  }, [])

  // --- quick demo login (no credentials) ----------------------------------
  const demoLoginAs = useCallback(async (uidValue) => {
    const rec = await getUserByUid(uidValue)
    if (!rec) throw new Error('Demo user not found')
    localStorage.setItem(DEMO_SESSION_KEY, rec.uid)
    setProfile(rec)
    return rec
  }, [])

  // --- profile update ------------------------------------------------------
  const saveProfile = useCallback(
    async (patch) => {
      if (!profile) return
      const updated = await updateUser(profile.id, patch)
      setProfile((p) => ({ ...p, ...patch, ...updated }))
    },
    [profile],
  )

  const refreshProfile = useCallback(async () => {
    if (!profile) return
    const rec = await getUserByUid(profile.uid)
    if (rec) setProfile(rec)
  }, [profile])

  // --- logout --------------------------------------------------------------
  const logout = useCallback(async () => {
    if (isFirebaseConfigured) {
      const { signOut } = await import('firebase/auth')
      await signOut(auth)
    } else {
      localStorage.removeItem(DEMO_SESSION_KEY)
    }
    setProfile(null)
  }, [])

  const value = {
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    isDemo: !isFirebaseConfigured,
    signUp,
    login,
    loginWithGoogle,
    demoLoginAs,
    saveProfile,
    refreshProfile,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
