import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Sparkles, Calendar, Palmtree, Clock } from 'lucide-react';
import { usePTO } from '../contexts/PTOContext';
import { findLongWeekendOpportunities, calculateBalances } from '../utils/ptoCalculations';
import { PTO_CONFIG } from '../data/constants';

export default function LongWeekends() {
  const { absences, addScenario } = usePTO();
  const today = format(new Date(), 'yyyy-MM-dd');

  const opportunities = useMemo(() => findLongWeekendOpportunities(absences), [absences]);
  const balances = useMemo(() => calculateBalances(absences, today), [absences, today]);

  const holidayOpps = opportunities.filter(o => !o.isFlex);
  const flexOpps = opportunities.filter(o => o.isFlex);

  const totalPTOForAll = opportunities.reduce((sum, o) => sum + o.ptoHours, 0);

  const handleAddToPlanner = (opp) => {
    addScenario({
      name: opp.description,
      days: opp.dates.map(d => ({ date: d })),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Sparkles size={20} className="text-warning-500" />
          🏖️ Long Weekend Optimizer
        </h2>
        <p className="text-xs text-slate-400">
          Maximize time off with minimal PTO usage — combine holidays, flex Fridays, and strategic PTO days
        </p>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200 rounded-xl p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary-400">{opportunities.length}</p>
            <p className="text-xs text-slate-400">Opportunities</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-accent-500">{totalPTOForAll}h</p>
            <p className="text-xs text-slate-400">PTO needed for all</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-success-600">{balances.combined.balance.toFixed(0)}h</p>
            <p className="text-xs text-slate-400">Available PTO</p>
          </div>
        </div>
      </div>

      {/* Holiday-based */}
      {holidayOpps.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
            <Palmtree size={16} className="text-success-500" />
            🌴 Holiday Long Weekends
          </h3>
          <div className="space-y-2">
            {holidayOpps.map((opp, i) => (
              <div key={i} className="bg-surface rounded-xl border border-surface-border p-3 flex items-center justify-between card-hover">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-200">{opp.description}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar size={10} /> {opp.type}
                    </span>
                    <span className="text-xs text-primary-400 flex items-center gap-1">
                      <Clock size={10} /> {opp.ptoDays} PTO day{opp.ptoDays > 1 ? 's' : ''} ({opp.ptoHours}h)
                    </span>
                  </div>
                </div>
                <button onClick={() => handleAddToPlanner(opp)}
                  className="ml-3 text-xs px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors whitespace-nowrap">
                  Add to Planner
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Flex Friday combos */}
      {flexOpps.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
            <Calendar size={16} className="text-primary-500" />
            📅 Flex Friday + PTO Combos
          </h3>
          <p className="text-xs text-slate-500 mb-2">
            Take Thursday off when you have a Flex Friday for a 4-day weekend using only 1 PTO day.
            Remember: you must work 4x10h Mon-Wed + the day you're working before flex.
          </p>
          <div className="space-y-2">
            {flexOpps.slice(0, 8).map((opp, i) => (
              <div key={i} className="bg-surface rounded-xl border border-surface-border p-3 flex items-center justify-between card-hover">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-200">{opp.description}</p>
                  <span className="text-xs text-primary-400">{opp.ptoDays} PTO day ({opp.ptoHours}h)</span>
                </div>
                <button onClick={() => handleAddToPlanner(opp)}
                  className="ml-3 text-xs px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors whitespace-nowrap">
                  Add to Planner
                </button>
              </div>
            ))}
          </div>
          {flexOpps.length > 8 && (
            <p className="text-xs text-slate-500 text-center mt-2">
              + {flexOpps.length - 8} more flex weekend opportunities
            </p>
          )}
        </div>
      )}

      {opportunities.length === 0 && (
        <div className="bg-surface rounded-xl border border-surface-border p-8 text-center">
          <Sparkles size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No long weekend opportunities found for the rest of the year.</p>
        </div>
      )}
    </div>
  );
}
