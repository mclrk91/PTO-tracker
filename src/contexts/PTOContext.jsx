import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { DEFAULT_ABSENCES } from '../data/constants';
import {
  initFirebase, signInAnon, saveToFirebase, subscribeToFirebase,
  loadLocalData, saveLocalData, loadSyncCode, saveSyncCode
} from '../utils/firebase';

const PTOContext = createContext(null);

const DEFAULT_STATE = {
  absences: DEFAULT_ABSENCES,
  scenarios: [],
};

export function PTOProvider({ children }) {
  const [data, setData] = useState(() => {
    const stored = loadLocalData();
    if (stored && stored.absences) {
      return { absences: stored.absences, scenarios: stored.scenarios || [] };
    }
    return DEFAULT_STATE;
  });

  const [syncCode, setSyncCodeState] = useState(() => loadSyncCode());
  const [syncStatus, setSyncStatus] = useState('disconnected'); // disconnected | connecting | synced | error
  const [lastSynced, setLastSynced] = useState(null);
  const unsubRef = useRef(null);
  const skipNextRemoteUpdate = useRef(false);

  // Initialize Firebase on mount
  useEffect(() => {
    initFirebase();
  }, []);

  // Set up sync when syncCode changes
  useEffect(() => {
    // Clean up previous subscription
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    if (!syncCode) {
      setSyncStatus('disconnected');
      return;
    }

    setSyncStatus('connecting');

    const startSync = async () => {
      const user = await signInAnon();
      if (!user) {
        setSyncStatus('error');
        return;
      }

      // Subscribe to remote changes
      unsubRef.current = subscribeToFirebase(syncCode, (remoteData) => {
        if (skipNextRemoteUpdate.current) {
          skipNextRemoteUpdate.current = false;
          return;
        }
        if (remoteData && remoteData.absences) {
          setData({ absences: remoteData.absences, scenarios: remoteData.scenarios || [] });
          saveLocalData({ absences: remoteData.absences, scenarios: remoteData.scenarios || [] });
          setLastSynced(new Date());
        }
        setSyncStatus('synced');
      });

      // Push current local data to Firebase on first connect
      skipNextRemoteUpdate.current = true;
      saveToFirebase(syncCode, data);
      setSyncStatus('synced');
      setLastSynced(new Date());
    };

    startSync();

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [syncCode]);

  // Save to localStorage + Firebase on every data change
  useEffect(() => {
    saveLocalData(data);
    if (syncCode && syncStatus === 'synced') {
      skipNextRemoteUpdate.current = true;
      saveToFirebase(syncCode, data);
      setLastSynced(new Date());
    }
  }, [data]);

  const setSyncCode = useCallback((code) => {
    const trimmed = code.trim();
    saveSyncCode(trimmed);
    setSyncCodeState(trimmed);
  }, []);

  const disconnectSync = useCallback(() => {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
    saveSyncCode('');
    setSyncCodeState('');
    setSyncStatus('disconnected');
    setLastSynced(null);
  }, []);

  const addAbsence = useCallback((absence) => {
    setData(prev => ({
      ...prev,
      absences: [...prev.absences, { ...absence, id: 'abs-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6) }],
    }));
  }, []);

  const updateAbsence = useCallback((id, updates) => {
    setData(prev => ({
      ...prev,
      absences: prev.absences.map(a => a.id === id ? { ...a, ...updates } : a),
    }));
  }, []);

  const deleteAbsence = useCallback((id) => {
    setData(prev => ({
      ...prev,
      absences: prev.absences.filter(a => a.id !== id),
    }));
  }, []);

  const addScenario = useCallback((scenario) => {
    setData(prev => ({
      ...prev,
      scenarios: [...prev.scenarios, { ...scenario, id: 'scn-' + Date.now() }],
    }));
  }, []);

  const updateScenario = useCallback((id, updates) => {
    setData(prev => ({
      ...prev,
      scenarios: prev.scenarios.map(s => s.id === id ? { ...s, ...updates } : s),
    }));
  }, []);

  const deleteScenario = useCallback((id) => {
    setData(prev => ({
      ...prev,
      scenarios: prev.scenarios.filter(s => s.id !== id),
    }));
  }, []);

  const commitScenario = useCallback((id) => {
    setData(prev => {
      const scenario = prev.scenarios.find(s => s.id === id);
      if (!scenario) return prev;
      const newAbsences = scenario.days.map((day, i) => ({
        id: 'abs-' + Date.now() + '-' + i,
        date: day.date,
        hours: 8,
        type: 'Planned',
        reason: scenario.name,
        status: 'Scheduled',
        pool: day.pool || 'granted',
      }));
      return {
        ...prev,
        absences: [...prev.absences, ...newAbsences],
        scenarios: prev.scenarios.filter(s => s.id !== id),
      };
    });
  }, []);

  return (
    <PTOContext.Provider value={{
      data,
      absences: data.absences,
      scenarios: data.scenarios,
      syncCode,
      syncStatus,
      lastSynced,
      setSyncCode,
      disconnectSync,
      addAbsence,
      updateAbsence,
      deleteAbsence,
      addScenario,
      updateScenario,
      deleteScenario,
      commitScenario,
    }}>
      {children}
    </PTOContext.Provider>
  );
}

export function usePTO() {
  const ctx = useContext(PTOContext);
  if (!ctx) throw new Error('usePTO must be used within PTOProvider');
  return ctx;
}
