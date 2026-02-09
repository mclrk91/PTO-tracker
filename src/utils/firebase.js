import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, set, onValue, off } from 'firebase/database';

// Firebase config - using a free project for PTO tracker sync
// This is a client-side config and is safe to expose
const firebaseConfig = {
  apiKey: "AIzaSyDummy-placeholder-key",
  authDomain: "pto-tracker-sync.firebaseapp.com",
  databaseURL: "https://pto-tracker-sync-default-rtdb.firebaseio.com",
  projectId: "pto-tracker-sync",
  storageBucket: "pto-tracker-sync.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000000000"
};

let app = null;
let auth = null;
let db = null;
let isInitialized = false;

export function initFirebase(config) {
  if (isInitialized) return { app, auth, db };
  try {
    app = initializeApp(config || firebaseConfig);
    auth = getAuth(app);
    db = getDatabase(app);
    isInitialized = true;
    return { app, auth, db };
  } catch (e) {
    console.warn('Firebase init failed, using local storage only:', e.message);
    return { app: null, auth: null, db: null };
  }
}

export function isFirebaseReady() {
  return isInitialized && db !== null;
}

// Generate a simple sync code from a passphrase
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'pto_' + Math.abs(hash).toString(36);
}

export async function signInWithSyncCode(syncCode) {
  if (!auth) return null;
  try {
    const result = await signInAnonymously(auth);
    return { uid: hashCode(syncCode), firebaseUid: result.user.uid };
  } catch (e) {
    console.warn('Auth failed:', e.message);
    return null;
  }
}

export function saveData(syncId, data) {
  if (!db || !syncId) {
    // Fallback to localStorage
    localStorage.setItem('pto-tracker-data', JSON.stringify(data));
    return;
  }
  try {
    const dataRef = ref(db, `users/${syncId}`);
    set(dataRef, { ...data, lastUpdated: Date.now() });
  } catch (e) {
    console.warn('Firebase save failed, using localStorage:', e.message);
    localStorage.setItem('pto-tracker-data', JSON.stringify(data));
  }
}

export function subscribeToData(syncId, callback) {
  if (!db || !syncId) {
    // Load from localStorage
    const stored = localStorage.getItem('pto-tracker-data');
    if (stored) callback(JSON.parse(stored));
    return () => {};
  }
  const dataRef = ref(db, `users/${syncId}`);
  onValue(dataRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      // Also cache locally
      localStorage.setItem('pto-tracker-data', JSON.stringify(data));
      callback(data);
    }
  });
  return () => off(dataRef);
}

export function loadLocalData() {
  const stored = localStorage.getItem('pto-tracker-data');
  return stored ? JSON.parse(stored) : null;
}

export function saveLocalData(data) {
  localStorage.setItem('pto-tracker-data', JSON.stringify(data));
}
