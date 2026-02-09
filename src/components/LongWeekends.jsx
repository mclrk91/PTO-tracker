import { useState, useMemo } from 'react';
import { format, parseISO, addDays, subDays, getDay, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import { usePTO } from '../contexts/PTOContext';
import { findLongWeekendOpportunities, calculateBalances } from '../utils/ptoCalculations';
import { PTO_CONFIG, COMPANY_HOLIDAYS } from '../data/constants';

function MiniCalendar({ opp }) {
  // Find the holiday date from COMPANY_HOLIDAYS
  const holidayEntry = COMPANY_HOLIDAYS.find(h => h.name === opp.holiday);
  const holidayDate = holidayEntry ? holidayEntry.date : null;

  // Collect all "off" dates: PTO dates + holiday date + find adjacent weekends
  const ptoDates = new Set(opp.dates);
  const offDates = new Set(opp.dates);
  if (holidayDate) offDates.add(holidayDate);

  // Find the full range of consecutive off days (including weekends)
  const allDates = [...offDates].map(d => parseISO(d)).sort((a, b) => a - b);
  let rangeStart = allDates[0];
  let rangeEnd = allDates[allDates.length - 1];

  // Expand to include adjacent weekends
  while (getDay(subDays(rangeStart, 1)) === 0 || getDay(subDays(rangeStart, 1)) === 6) {
    rangeStart = subDays(rangeStart, 1);
  }
  while (getDay(addDays(rangeEnd, 1)) === 0 || getDay(addDays(rangeEnd, 1)) === 6) {
    rangeEnd = addDays(rangeEnd, 1);
  }

  // Show full weeks: one week before through one week after
  const calStart = startOfWeek(subDays(rangeStart, 7));
  const calEnd = endOfWeek(addDays(rangeEnd, 7));
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  // Count consecutive off days for explanation
  const offSpan = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
  const offDayCount = offSpan.length;

  // Build explanation parts
  const parts = [];
  offSpan.forEach(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dow = getDay(day);
    const dayName = format(day, 'EEE');
    if (dow === 0 || dow === 6) {
      parts.push(`${dayName} (weekend)`);
    } else if (holidayDate && dateStr === holidayDate) {
      parts.push(`${dayName} (${opp.holiday})`);
    } else if (ptoDates.has(dateStr)) {
      parts.push(`${dayName} (PTO)`);
    }
  });

  return (
    <div className="mt-3 space-y-3">
      {/* Calendar grid header */}
      <div className="grid grid-cols-7 gap-0.5">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-[10px] font-semibold text-slate-500 text-center py-1">{d}</div>
        ))}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dow = getDay(day);
          const isWeekend = dow === 0 || dow === 6;
          const isHoliday = holidayDate && dateStr === holidayDate;
          const isPTO = ptoDates.has(dateStr);

          let bgColor = 'bg-surface-dark/50 text-slate-600';
          if (isPTO) bgColor = 'bg-primary-100 text-primary-400 font-bold';
          else if (isHoliday) bgColor = 'bg-success-100 text-success-600 font-bold';
          else if (isWeekend) bgColor = 'bg-surface-light/50 text-slate-500';

          return (
            <div key={dateStr} className={`text-center rounded-md py-1.5 text-xs ${bgColor}`}>
              {format(day, 'd')}
            </div>
          );
        })}
      </div>

      {/* Month label */}
      <p className="text-[10px] text-slate-600 text-center">
        {format(rangeStart, 'MMMM yyyy')}
      </p>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] text-slate-500">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-primary-100 border border-primary-200" /> PTO day</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-success-100 border border-success-500/20" /> Holiday</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-surface-light/50" /> Weekend</span>
      </div>

      {/* Explanation */}
      <p className="text-xs text-slate-400">
        {parts.join(' + ')} = <span className="text-slate-200 font-medium">{offDayCount} consecutive days off</span> using only {opp.ptoDays} PTO day{opp.ptoDays > 1 ? 's' : ''} ({opp.ptoHours}h)
      </p>
    </div>
  );
}

export default function LongWeekends() {
  const { absences, addScenario } = usePTO();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [expandedIndex, setExpandedIndex] = useState(null);

  const opportunities = useMemo(() => findLongWeekendOpportunities(absences), [absences]);
  const balances = useMemo(() => calculateBalances(absences, today), [absences, today]);

  const holidayOpps = opportunities.filter(o => !o.isFlex);
  const flexOpps = opportunities.filter(o => o.isFlex);

  const totalPTOForAll = opportunities.reduce((sum, o) => sum + o.ptoHours, 0);

  const handleAddToPlanner = (e, opp) => {
    e.stopPropagation();
    addScenario({
      name: opp.description,
      days: opp.dates.map(d => ({ date: d })),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-100">
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
          <h3 className="text-sm font-semibold text-slate-300 mb-2">
            🌴 Holiday Long Weekends
          </h3>
          <div className="space-y-2">
            {holidayOpps.map((opp, i) => (
              <div key={i} className="bg-surface rounded-xl border border-surface-border overflow-hidden card-hover">
                <div
                  className="p-3 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-200">{opp.description}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-500">
                        {opp.type}
                      </span>
                      <span className="text-xs text-primary-400">
                        {opp.ptoDays} PTO day{opp.ptoDays > 1 ? 's' : ''} ({opp.ptoHours}h)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => handleAddToPlanner(e, opp)}
                      className="text-xs px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors whitespace-nowrap">
                      Add to Planner
                    </button>
                    <span className={`text-slate-500 transition-transform ${expandedIndex === i ? 'rotate-90' : ''}`}>
                      ▸
                    </span>
                  </div>
                </div>
                {expandedIndex === i && (
                  <div className="px-3 pb-3 border-t border-surface-border-subtle pt-3">
                    <MiniCalendar opp={opp} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Flex Friday combos */}
      {flexOpps.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-2">
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
                <button onClick={(e) => handleAddToPlanner(e, opp)}
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
          <p className="text-3xl mb-3">🏖️</p>
          <p className="text-sm text-slate-400">No long weekend opportunities found for the rest of the year.</p>
        </div>
      )}
    </div>
  );
}
