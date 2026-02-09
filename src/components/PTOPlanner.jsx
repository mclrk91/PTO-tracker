import { useState, useMemo } from 'react';
import { format, parseISO, eachDayOfInterval, getDay, addDays } from 'date-fns';
import { Plus, Trash2, Check, ArrowRight, FlaskConical, GitCompare, CalendarPlus } from 'lucide-react';
import { usePTO } from '../contexts/PTOContext';
import { calculateBalances, calculateYearEndForecast, assignPool, isBusinessDay, isFlexFridayAvailable } from '../utils/ptoCalculations';
import { PTO_CONFIG, COMPANY_HOLIDAYS, GROUP1_FLEX_FRIDAYS } from '../data/constants';

function ScenarioCard({ scenario, absences, onDelete, onCommit, isCompare }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const scenarioDays = scenario.days || [];

  // Calculate what balances would look like with this scenario's days added
  const simulatedAbsences = useMemo(() => {
    const simAbsences = [...absences];
    const sortedDays = [...scenarioDays].sort((a, b) => a.date.localeCompare(b.date));
    sortedDays.forEach(day => {
      const pool = assignPool(simAbsences, day.date);
      simAbsences.push({
        id: 'sim-' + day.date,
        date: day.date,
        hours: 8,
        type: 'Planned',
        reason: scenario.name,
        status: 'Simulated',
        pool,
      });
    });
    return simAbsences;
  }, [absences, scenarioDays, scenario.name]);

  const currentBalances = useMemo(() => calculateBalances(absences, today), [absences, today]);
  const simBalances = useMemo(() => calculateBalances(simulatedAbsences, '2026-12-31'), [simulatedAbsences]);
  const forecast = useMemo(() => calculateYearEndForecast(simulatedAbsences), [simulatedAbsences]);

  const totalHours = scenarioDays.length * 8;
  const totalDays = scenarioDays.length;

  // Check which flex fridays would be lost
  const lostFlexFridays = useMemo(() => {
    const lost = [];
    scenarioDays.forEach(day => {
      const d = parseISO(day.date);
      const dayOfWeek = getDay(d);
      // If this day is Mon-Thu, check if there's a flex friday that week
      if (dayOfWeek >= 1 && dayOfWeek <= 4) {
        const friday = addDays(d, 5 - dayOfWeek);
        const fridayStr = format(friday, 'yyyy-MM-dd');
        if (GROUP1_FLEX_FRIDAYS.includes(fridayStr) && !lost.includes(fridayStr)) {
          lost.push(fridayStr);
        }
      }
    });
    return lost;
  }, [scenarioDays]);

  const borderColor = isCompare ? 'border-accent-300' : 'border-primary-200';
  const headerBg = isCompare ? 'bg-accent-50' : 'bg-primary-50';

  return (
    <div className={`bg-white border ${borderColor} rounded-xl overflow-hidden`}>
      <div className={`${headerBg} px-4 py-3 flex items-center justify-between`}>
        <div>
          <h3 className="font-semibold text-slate-800">{scenario.name}</h3>
          <p className="text-xs text-slate-500">{totalDays} days ({totalHours}h)</p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onCommit(scenario.id)}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-success-600 text-white rounded-lg hover:bg-success-500 transition-colors"
            title="Add these days to your actual PTO">
            <CalendarPlus size={12} /> Commit
          </button>
          <button onClick={() => onDelete(scenario.id)}
            className="p-1 text-slate-400 hover:text-danger-500 rounded-lg transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {/* Days list */}
        <div className="flex flex-wrap gap-1.5">
          {scenarioDays.sort((a, b) => a.date.localeCompare(b.date)).map(day => (
            <span key={day.date} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
              {format(parseISO(day.date), 'EEE MMM d')}
            </span>
          ))}
        </div>

        {/* Impact */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-50 rounded-lg p-2">
            <p className="text-xs text-slate-400">Granted After</p>
            <p className="text-sm font-bold text-primary-700">{simBalances.granted.balance.toFixed(1)}h</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-2">
            <p className="text-xs text-slate-400">Purchased After</p>
            <p className="text-sm font-bold text-accent-500">{simBalances.purchased.balance.toFixed(1)}h</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-2">
            <p className="text-xs text-slate-400">Year-End Total</p>
            <p className="text-sm font-bold text-slate-700">{forecast.totalYearEnd.toFixed(1)}h</p>
          </div>
        </div>

        {/* Warnings */}
        {lostFlexFridays.length > 0 && (
          <div className="bg-warning-50 border border-warning-500/20 rounded-lg p-2 text-xs text-warning-600">
            <strong>Flex Friday impact:</strong> Taking PTO during these weeks means you lose {lostFlexFridays.length} flex Friday(s):
            {' '}{lostFlexFridays.map(f => format(parseISO(f), 'MMM d')).join(', ')}
          </div>
        )}
        {forecast.purchasedForfeited > 0 && forecast.purchasedYearEnd > 0 && (
          <div className="bg-warning-50 border border-warning-500/20 rounded-lg p-2 text-xs text-warning-600">
            <strong>Purchased PTO alert:</strong> {forecast.purchasedForfeited}h purchased PTO would still be unused at year-end (forfeited or must cash out).
          </div>
        )}
        {forecast.deficit > 0 && (
          <div className="bg-danger-50 border border-danger-500/20 rounded-lg p-2 text-xs text-danger-600">
            <strong>Deficit:</strong> You would need to borrow {forecast.deficit}h. Max borrowable: {PTO_CONFIG.maxBorrow}h.
          </div>
        )}
      </div>
    </div>
  );
}

export default function PTOPlanner() {
  const { absences, scenarios, addScenario, deleteScenario, commitScenario } = usePTO();
  const [showCreate, setShowCreate] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState([]);
  const [newName, setNewName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDates, setSelectedDates] = useState([]);

  const handleAddDateRange = () => {
    if (!startDate || !endDate) return;
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const days = eachDayOfInterval({ start, end });
    const businessDays = days
      .filter(d => !isWeekendDay(d) && !COMPANY_HOLIDAYS.some(h => h.date === format(d, 'yyyy-MM-dd')))
      .map(d => ({ date: format(d, 'yyyy-MM-dd') }));
    setSelectedDates(prev => {
      const existing = new Set(prev.map(d => d.date));
      const newDays = businessDays.filter(d => !existing.has(d.date));
      return [...prev, ...newDays].sort((a, b) => a.date.localeCompare(b.date));
    });
  };

  const isWeekendDay = (date) => {
    const day = getDay(date);
    return day === 0 || day === 6;
  };

  const handleCreate = () => {
    if (!newName || selectedDates.length === 0) return;
    addScenario({
      name: newName,
      days: selectedDates,
    });
    setNewName('');
    setSelectedDates([]);
    setStartDate('');
    setEndDate('');
    setShowCreate(false);
  };

  const handleCommit = (id) => {
    if (confirm('This will add these days to your actual PTO history. Continue?')) {
      commitScenario(id);
    }
  };

  const toggleCompare = (id) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const removeDate = (date) => {
    setSelectedDates(prev => prev.filter(d => d.date !== date));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FlaskConical size={20} className="text-primary-500" />
            What-If Planner
          </h2>
          <p className="text-xs text-slate-500">Model scenarios and see their impact before committing</p>
        </div>
        <div className="flex gap-2">
          {scenarios.length >= 2 && (
            <button onClick={() => { setCompareMode(!compareMode); setCompareIds([]); }}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                compareMode ? 'bg-accent-100 text-accent-500' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              <GitCompare size={14} /> Compare
            </button>
          )}
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors">
            <Plus size={14} /> New Scenario
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-white border border-primary-200 rounded-xl p-4 space-y-3">
          <input type="text" placeholder="Scenario name (e.g., 'Spring Break Cruise')"
            value={newName} onChange={e => setNewName(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <button onClick={handleAddDateRange}
              className="flex items-center gap-1 px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
              <Plus size={14} /> Add Range
            </button>
          </div>

          {selectedDates.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Selected days ({selectedDates.length} business days, {selectedDates.length * 8}h):</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedDates.map(d => (
                  <span key={d.date} className="inline-flex items-center gap-1 text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-lg">
                    {format(parseISO(d.date), 'EEE MMM d')}
                    <button onClick={() => removeDate(d.date)} className="hover:text-danger-500">
                      <Trash2 size={10} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowCreate(false); setSelectedDates([]); setNewName(''); }}
              className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button onClick={handleCreate} disabled={!newName || selectedDates.length === 0}
              className="px-4 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
              <Check size={14} /> Create Scenario
            </button>
          </div>
        </div>
      )}

      {/* Compare Mode */}
      {compareMode && scenarios.length >= 2 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <p className="text-xs text-slate-500 mb-2">Select 2 scenarios to compare side-by-side:</p>
          <div className="flex flex-wrap gap-2">
            {scenarios.map(s => (
              <button key={s.id} onClick={() => toggleCompare(s.id)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  compareIds.includes(s.id)
                    ? 'bg-primary-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-primary-300'
                }`}>
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Scenarios */}
      {compareMode && compareIds.length === 2 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {compareIds.map((id, i) => {
            const scenario = scenarios.find(s => s.id === id);
            return scenario ? (
              <ScenarioCard key={id} scenario={scenario} absences={absences}
                onDelete={deleteScenario} onCommit={handleCommit} isCompare={i === 1} />
            ) : null;
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scenarios.map(s => (
            <ScenarioCard key={s.id} scenario={s} absences={absences}
              onDelete={deleteScenario} onCommit={handleCommit} isCompare={false} />
          ))}
        </div>
      )}

      {scenarios.length === 0 && !showCreate && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <FlaskConical size={40} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-600 mb-1">No scenarios yet</h3>
          <p className="text-xs text-slate-400 mb-4">
            Create a scenario to model PTO days and see their impact on your balances.
          </p>
          <button onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors">
            Create Your First Scenario
          </button>
        </div>
      )}

      {/* Quick Scenarios */}
      {scenarios.length === 0 && !showCreate && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-600 mb-3">Quick Start Suggestions</h3>
          <div className="space-y-2">
            <button onClick={() => {
              addScenario({
                name: 'Virgin Voyages Family Cruise',
                days: [
                  { date: '2026-03-16' }, { date: '2026-03-17' },
                  { date: '2026-03-18' }, { date: '2026-03-19' }, { date: '2026-03-20' },
                ],
              });
            }} className="w-full text-left p-3 bg-slate-50 hover:bg-primary-50 rounded-lg transition-colors border border-slate-100">
              <p className="text-sm font-medium text-slate-700">Spring Break Cruise — Mar 16-20</p>
              <p className="text-xs text-slate-400">5 days, 40 hours</p>
            </button>
            <button onClick={() => {
              addScenario({
                name: 'Endometriosis Surgery + Recovery',
                days: [
                  { date: '2026-04-02' }, { date: '2026-04-03' },
                  { date: '2026-04-06' }, { date: '2026-04-07' },
                  { date: '2026-04-08' }, { date: '2026-04-09' }, { date: '2026-04-10' },
                ],
              });
            }} className="w-full text-left p-3 bg-slate-50 hover:bg-primary-50 rounded-lg transition-colors border border-slate-100">
              <p className="text-sm font-medium text-slate-700">Surgery + Full Recovery — Apr 2-10</p>
              <p className="text-xs text-slate-400">7 business days, 56 hours (pre-op + surgery + recovery week)</p>
            </button>
            <button onClick={() => {
              addScenario({
                name: 'Surgery Day Only',
                days: [{ date: '2026-04-03' }],
              });
            }} className="w-full text-left p-3 bg-slate-50 hover:bg-primary-50 rounded-lg transition-colors border border-slate-100">
              <p className="text-sm font-medium text-slate-700">Surgery Day Only — Apr 3</p>
              <p className="text-xs text-slate-400">1 day, 8 hours</p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
