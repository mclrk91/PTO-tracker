import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DEFAULT_ABSENCES } from '../data/constants';
import { saveLocalData, loadLocalData } from '../utils/firebase';

const PTOContext = createContext(null);

const DEFAULT_STATE = {
  absences: DEFAULT_ABSENCES,
  scenarios: [],
  settings: {
    syncEnabled: false,
    syncCode: '',
  },
};

export function PTOProvider({ children }) {
  const [data, setData] = useState(() => {
    const stored = loadLocalData();
    if (stored && stored.absences) {
      return { ...DEFAULT_STATE, ...stored };
    }
    return DEFAULT_STATE;
  });

  // Persist to localStorage on every change
  useEffect(() => {
    saveLocalData(data);
  }, [data]);

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

  const updateSettings = useCallback((updates) => {
    setData(prev => ({
      ...prev,
      settings: { ...prev.settings, ...updates },
    }));
  }, []);

  return (
    <PTOContext.Provider value={{
      data,
      absences: data.absences,
      scenarios: data.scenarios,
      settings: data.settings,
      addAbsence,
      updateAbsence,
      deleteAbsence,
      addScenario,
      updateScenario,
      deleteScenario,
      commitScenario,
      updateSettings,
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
