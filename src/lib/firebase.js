import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey:            'AIzaSyCzRCL67GIavs0lu3KzmxfBVua6h2Us4tY',
  authDomain:        'system-soporte.firebaseapp.com',
  projectId:         'system-soporte',
  storageBucket:     'system-soporte.firebasestorage.app',
  messagingSenderId: '1049363703275',
  appId:             '1:1049363703275:web:fd9fa9997b684f0cbf65ae',
}

const app = initializeApp(firebaseConfig)

export const auth    = getAuth(app)
export const db      = getFirestore(app)
export const storage = getStorage(app)
export const googleProvider = new GoogleAuthProvider()
export { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink }
