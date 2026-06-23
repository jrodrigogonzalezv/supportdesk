import { useState, useEffect, createContext, useContext } from 'react'
import { onAuthStateChanged, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from '../lib/firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, async firebaseUser => {
      if (!firebaseUser) { setUser(null); setLoading(false); return }

      setUser(prev =>
        prev?.uid === firebaseUser.uid ? prev : { ...firebaseUser, profile: {}, isSuperAdmin: false }
      )
      setLoading(false)

      try { await ensureUserDoc(firebaseUser) } catch (e) {
        console.warn('[useAuth] ensureUserDoc:', e.code, e.message)
      }

      try {
        const [snap, saSnap] = await Promise.all([
          getDoc(doc(db, 'users', firebaseUser.uid)),
          firebaseUser.email ? getDoc(doc(db, 'superAdmins', firebaseUser.email)) : Promise.resolve(null),
        ])
        setUser({ ...firebaseUser, profile: snap.data() || {}, isSuperAdmin: saSnap?.exists() ?? false })
      } catch (e) {
        console.warn('[useAuth] profile fetch:', e.code, e.message)
      }
    })
  }, [])

  async function ensureUserDoc(firebaseUser, extra = {}) {
    const ref = doc(db, 'users', firebaseUser.uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      const isClientSignIn = localStorage.getItem('sd_client_signin') === 'true' || window.location.pathname === '/portal'
      if (isClientSignIn) {
        localStorage.removeItem('sd_client_signin')
        await setDoc(ref, { email: firebaseUser.email, displayName: firebaseUser.displayName || '', role: 'client', createdAt: serverTimestamp() })
        return
      }
      const orgId = firebaseUser.uid
      await setDoc(doc(db, 'organizations', orgId), {
        name: extra.displayName || firebaseUser.displayName || firebaseUser.email || 'Mi organización',
        ownerId: firebaseUser.uid,
        adminEmail: firebaseUser.email || '',
        adminPhone: '',
        slug: '',
        ticketCounter: 0,
        categories: [],
        companies: [],
        createdAt: serverTimestamp(),
      })
      await setDoc(ref, {
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || extra.displayName || '',
        photoURL: firebaseUser.photoURL || '',
        orgId,
        role: 'admin',
        createdAt: serverTimestamp(),
        plan: 'free',
      })
    } else {
      const data = snap.data()
      if (data.role === 'client') return
      if (!data.orgId) {
        const orgId = firebaseUser.uid
        await setDoc(doc(db, 'organizations', orgId), {
          name: data.displayName || 'Mi organización',
          ownerId: firebaseUser.uid,
          adminEmail: firebaseUser.email || '',
          adminPhone: '',
          slug: '',
          ticketCounter: 0,
          categories: [],
          companies: [],
          createdAt: serverTimestamp(),
        }, { merge: true })
        await updateDoc(ref, { orgId, role: 'admin' })
      }
    }
  }

  async function loginWithGoogle() { return (await signInWithPopup(auth, googleProvider)).user }
  async function loginWithEmail(email, password) { return (await signInWithEmailAndPassword(auth, email, password)).user }
  async function registerWithEmail(email, password, name) {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(result.user, { displayName: name })
    return result.user
  }
  async function loginAsClient() {
    localStorage.setItem('sd_client_signin', 'true')
    return loginWithGoogle()
  }
  async function registerAsClient(email, password, name) {
    localStorage.setItem('sd_client_signin', 'true')
    return registerWithEmail(email, password, name)
  }
  async function logout() { await signOut(auth) }

  async function claimInvite(inviteId) {
    if (!user) throw new Error('Debes iniciar sesión primero')
    const inviteRef = doc(db, 'invites', inviteId)
    const inviteSnap = await getDoc(inviteRef)
    if (!inviteSnap.exists()) throw new Error('Invitación no encontrada o expirada')
    const invite = inviteSnap.data()
    if (invite.claimed) throw new Error('Esta invitación ya fue utilizada')
    if (invite.expiresAt?.toDate() < new Date()) throw new Error('La invitación ha expirado')
    const userRef = doc(db, 'users', user.uid)
    await updateDoc(userRef, { orgId: invite.orgId, role: invite.role, joinedAt: serverTimestamp() })
    await updateDoc(inviteRef, { claimed: true, claimedBy: user.uid, claimedAt: serverTimestamp() })
    const snap = await getDoc(userRef)
    setUser(prev => ({ ...prev, profile: snap.data() }))
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithEmail, registerWithEmail, loginAsClient, registerAsClient, logout, claimInvite }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
