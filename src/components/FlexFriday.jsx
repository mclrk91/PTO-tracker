import { useMemo } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, startOfYear } from 'date-fns';
import { Info, AlertCircle } from 'lucide-react';
import { usePTO } from '../contexts/PTOContext';
import { isFlexFridayAvailable } from '../utils/ptoCalculations';
import { FLEX_GROUPS, GROUP1_FLEX_FRIDAYS, GROUP2_FLEX_FRIDAYS, BLACKOUT_FRIDAYS, COMPANY_HOLIDAYS, FLEX_REMINDERS, MARISSA_GROUP } from '../data/constants';

function MiniCalendar({ year, month, absences }) {
  const monthStart = startOfMonth(new Date(year, month));
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);

  const blanks = Array.from({ length: startDay }, (_, i) => i);

  return (
    <div className="bg-surface rounded-xl border border-surface-border p-3">
      <h4 className="text-sm font-semibold text-slate-200 mb-2 text-center">
        {format(monthStart, 'MMMM yyyy')}
      </h4>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} className="text-[10px] font-medium text-slate-500 py-1">{d}</div>
        ))}
        {blanks.map(i => <div key={`b-${i}`} />)}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayNum = format(day, 'd');
          const isG1 = GROUP1_FLEX_FRIDAYS.includes(dateStr);
          const isG2 = GROUP2_FLEX_FRIDAYS.includes(dateStr);
          const isBlackout = BLACKOUT_FRIDAYS.includes(dateStr);
          const isHoliday = COMPANY_HOLIDAYS.some(h => h.date === dateStr);
          const isMarissaFlex = isG1 && !isBlackout;
          const flexAvailable = isMarissaFlex ? isFlexFridayAvailable(dateStr, absences) : false;
          const isWeekend = getDay(day) === 0 || getDay(day) === 6;

          let bg = '';
          let text = 'text-slate-300';
          let ring = '';

          if (isHoliday) {
            bg = 'bg-surface-elevated';
            text = 'text-slate-400';
          } else if (isBlackout && getDay(day) === 5) {
            bg = 'bg-slate-950';
            text = 'text-white';
          } else if (isMarissaFlex) {
            bg = flexAvailable ? 'bg-primary-500' : 'bg-primary-200';
            text = flexAvailable ? 'text-white font-bold' : 'text-primary-500';
            ring = flexAvailable ? 'ring-2 ring-primary-300' : '';
          } else if (isG2 && !isBlackout) {
            bg = 'bg-accent-100';
            text = 'text-accent-600';
          } else if (isWeekend) {
            text = 'text-slate-600';
          }

          return (
            <div key={dateStr}
              className={`w-7 h-7 mx-auto flex items-center justify-center rounded-md text-xs ${bg} ${text} ${ring}`}
              title={
                isHoliday ? COMPANY_HOLIDAYS.find(h => h.date === dateStr)?.name :
                isBlackout ? 'Blackout Day' :
                isMarissaFlex ? `Your Flex Friday${flexAvailable ? '' : ' (unavailable - PTO that week)'}` :
                isG2 ? 'Group 2 Flex Friday' : ''
              }
            >
              {dayNum}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function FlexFriday() {
  const { absences } = usePTO();
  const today = format(new Date(), 'yyyy-MM-dd');

  const upcomingFlexDays = useMemo(() => {
    return GROUP1_FLEX_FRIDAYS
      .filter(d => d >= today && !BLACKOUT_FRIDAYS.includes(d))
      .map(d => ({
        date: d,
        available: isFlexFridayAvailable(d, absences),
      }));
  }, [absences, today]);

  const months = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-100">⚡ 2026 Flex Friday Schedule</h2>
        <p className="text-xs text-slate-400">TM Media — Schedule subject to change based on team volume, staffing, or other considerations</p>
      </div>

      {/* Legend */}
      <div className="bg-surface rounded-xl border border-surface-border p-3 flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary-500" />
          <span className="text-xs text-slate-300">Your Flex Day (Group 1)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-accent-100 border border-accent-200" />
          <span className="text-xs text-slate-300">Group 2 Flex Day</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-950" />
          <span className="text-xs text-slate-300">Blackout Day</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-surface-elevated" />
          <span className="text-xs text-slate-300">Company Holiday</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary-200" />
          <span className="text-xs text-slate-300">Your Flex (unavailable)</span>
        </div>
      </div>

      {/* Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-3">
          <h3 className="text-sm font-semibold text-primary-400 mb-2">Group 1 (Your Group)</h3>
          <div className="flex flex-wrap gap-1">
            {FLEX_GROUPS.group1.members.map(m => (
              <span key={m} className={`text-xs px-2 py-0.5 rounded-full ${
                m === 'Marissa' ? 'bg-primary-600 text-white font-bold' : 'bg-primary-100 text-primary-700'
              }`}>
                {m}
              </span>
            ))}
          </div>
        </div>
        <div className="bg-accent-50 border border-accent-200 rounded-xl p-3">
          <h3 className="text-sm font-semibold text-accent-500 mb-2">Group 2</h3>
          <div className="flex flex-wrap gap-1">
            {FLEX_GROUPS.group2.members.map(m => (
              <span key={m} className="text-xs bg-accent-100 text-accent-500 px-2 py-0.5 rounded-full">{m}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {months.map(m => (
          <MiniCalendar key={m} year={2026} month={m} absences={absences} />
        ))}
      </div>

      {/* Upcoming Flex Days */}
      <div className="bg-surface rounded-xl border border-surface-border p-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">📆 Your Upcoming Flex Fridays</h3>
        <div className="space-y-1.5">
          {upcomingFlexDays.slice(0, 10).map(f => (
            <div key={f.date} className="flex items-center justify-between py-1.5 border-b border-surface-border-subtle last:border-0">
              <span className="text-sm text-slate-200">{format(parseISO(f.date), 'EEEE, MMMM d')}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                f.available
                  ? 'bg-success-100 text-success-600'
                  : 'bg-danger-50 text-danger-500'
              }`}>
                {f.available ? 'Available' : 'Unavailable (PTO that week)'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Reminders */}
      <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-primary-400 mb-3 flex items-center gap-2">
          <Info size={16} />
          📌 Flex Friday Outlook Invite Reminders
        </h3>
        <ul className="space-y-2">
          {FLEX_REMINDERS.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-primary-300">
              <AlertCircle size={12} className="flex-shrink-0 mt-0.5 text-primary-500" />
              {r}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
