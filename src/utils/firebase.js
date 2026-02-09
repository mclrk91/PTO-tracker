import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getDatabase, ref, set, onValue, off } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAjXomrE9SxUJ_5xCpvSBCRG1yg1rS4GVg",
  authDomain: "pto-tracker-sync.firebaseapp.com",
  databaseURL: "https://pto-tracker-sync-default-rtdb.firebaseio.com",
  projectId: "pto-tracker-sync",
  storageBucket: "pto-tracker-sync.firebasestorage.app",
  messagingSenderId: "395223332110",
  appId: "1:395223332110:web:6098f296ec1239b8fad35f"
};

let app = null;
let auth = null;
let db = null;
let isInitialized = false;

export function initFirebase() {
  if (isInitialized) return { app, auth, db };
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getDatabase(app);
    isInitialized = true;
    return { app, auth, db };
  } catch (e) {
    console.warn('Firebase init failed:', e.message);
    return { app: null, auth: null, db: null };
  }
}

export function isFirebaseReady() {
  return isInitialized && db !== null;
}

// Hash a sync code into a stable database path key
function hashSyncCode(code) {
  let hash = 0;
  const str = code.trim().toLowerCase();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'pto_' + Math.abs(hash).toString(36);
}

export async function signInAnon() {
  if (!auth) {
    initFirebase();
    if (!auth) return null;
  }
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (e) {
    console.warn('Anonymous auth failed:', e.message);
    return null;
  }
}

export function getSyncPath(syncCode) {
  return hashSyncCode(syncCode);
}

export function saveToFirebase(syncCode, data) {
  if (!db || !syncCode) return;
  const path = hashSyncCode(syncCode);
  const dataRef = ref(db, `sync/${path}`);
  set(dataRef, { ...data, lastUpdated: Date.now() }).catch(e => {
    console.warn('Firebase save failed:', e.message);
  });
}

export function subscribeToFirebase(syncCode, callback) {
  if (!db || !syncCode) return () => {};
  const path = hashSyncCode(syncCode);
  const dataRef = ref(db, `sync/${path}`);
  const unsubscribe = onValue(dataRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      callback(data);
    }
  }, (error) => {
    console.warn('Firebase subscription error:', error.message);
  });
  return () => off(dataRef);
}

// localStorage helpers
export function loadLocalData() {
  try {
    const stored = localStorage.getItem('pto-tracker-data');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function saveLocalData(data) {
  try {
    localStorage.setItem('pto-tracker-data', JSON.stringify(data));
  } catch (e) {
    console.warn('localStorage save failed:', e.message);
  }
}

export function loadSyncCode() {
  try {
    return localStorage.getItem('pto-sync-code') || '';
  } catch {
    return '';
  }
}

export function saveSyncCode(code) {
  try {
    localStorage.setItem('pto-sync-code', code);
  } catch {}
}
