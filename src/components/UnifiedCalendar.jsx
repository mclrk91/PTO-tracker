import { useState, useMemo } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePTO } from '../contexts/PTOContext';
import { isFlexFridayAvailable } from '../utils/ptoCalculations';
import { GROUP1_FLEX_FRIDAYS, GROUP2_FLEX_FRIDAYS, BLACKOUT_FRIDAYS, COMPANY_HOLIDAYS, US_HOLIDAYS_NON_UHG, PAY_PERIOD_END_DATES, PAY_DATES } from '../data/constants';

export default function UnifiedCalendar() {
  const { absences } = usePTO();
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, new Date().getMonth()));
  const [showPaydays, setShowPaydays] = useState(true);
  const [showFlex, setShowFlex] = useState(true);
  const [showHolidays, setShowHolidays] = useState(true);
  const [showPTO, setShowPTO] = useState(true);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);
  const blanks = Array.from({ length: startDay }, (_, i) => i);

  const prev = () => setCurrentMonth(d => subMonths(d, 1));
  const next = () => setCurrentMonth(d => addMonths(d, 1));

  const absMap = useMemo(() => {
    const map = {};
    absences.forEach(a => { map[a.date] = a; });
    return map;
  }, [absences]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <button onClick={prev} className="p-2 hover:bg-surface-light rounded-lg transition-colors">
          <ChevronLeft size={20} className="text-slate-400" />
        </button>
        <h2 className="text-lg font-bold text-slate-100">
          🗓️ {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button onClick={next} className="p-2 hover:bg-surface-light rounded-lg transition-colors">
          <ChevronRight size={20} className="text-slate-400" />
        </button>
      </div>

      {/* Toggles */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'showPTO', label: 'PTO Days', color: 'bg-danger-500', state: showPTO, set: setShowPTO },
          { key: 'showFlex', label: 'Flex Fridays', color: 'bg-primary-500', state: showFlex, set: setShowFlex },
          { key: 'showHolidays', label: 'Holidays', color: 'bg-slate-400', state: showHolidays, set: setShowHolidays },
          { key: 'showPaydays', label: 'Paydays', color: 'bg-success-500', state: showPaydays, set: setShowPaydays },
        ].map(t => (
          <button key={t.key} onClick={() => t.set(!t.state)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
              t.state ? 'bg-surface border-surface-border text-slate-200' : 'bg-surface-dark border-surface-border-subtle text-slate-500 line-through'
            }`}>
            <div className={`w-2.5 h-2.5 rounded-full ${t.state ? t.color : 'bg-slate-600'}`} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Calendar */}
      <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
        <div className="grid grid-cols-7">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-xs font-semibold text-slate-400 text-center py-2 bg-surface-dark border-b border-surface-border">{d}</div>
          ))}
          {blanks.map(i => <div key={`b-${i}`} className="min-h-[80px] border-b border-r border-surface-border-subtle" />)}
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const isToday = dateStr === todayStr;
            const dayOfWeek = getDay(day);
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            const absence = absMap[dateStr];
            const isG1Flex = GROUP1_FLEX_FRIDAYS.includes(dateStr) && !BLACKOUT_FRIDAYS.includes(dateStr);
            const isG2Flex = GROUP2_FLEX_FRIDAYS.includes(dateStr) && !BLACKOUT_FRIDAYS.includes(dateStr);
            const isBlackout = BLACKOUT_FRIDAYS.includes(dateStr);
            const holiday = COMPANY_HOLIDAYS.find(h => h.date === dateStr);
            const nonUhgHoliday = US_HOLIDAYS_NON_UHG.find(h => h.date === dateStr);
            const isPayday = PAY_DATES.includes(dateStr);
            const isAccrualDay = PAY_PERIOD_END_DATES.includes(dateStr);

            const events = [];
            if (showPTO && absence) {
              events.push({ label: absence.reason || 'PTO', color: 'bg-danger-100 text-danger-600 border-danger-200' });
            }
            if (showHolidays && holiday) {
              events.push({ label: `🏢 ${holiday.name}`, color: 'bg-surface-light text-slate-300 border-surface-border' });
            }
            if (showHolidays && nonUhgHoliday) {
              events.push({ label: `${nonUhgHoliday.name} (not UHG)`, color: 'bg-surface-dark text-slate-500 border-surface-border-subtle' });
            }
            if (showFlex && isG1Flex) {
              const avail = isFlexFridayAvailable(dateStr, absences);
              events.push({
                label: avail ? 'Flex Friday' : 'Flex (N/A)',
                color: avail ? 'bg-primary-100 text-primary-700 border-primary-200' : 'bg-primary-50 text-primary-300 border-primary-100'
              });
            }
            if (showFlex && isG2Flex) {
              events.push({ label: 'G2 Flex', color: 'bg-accent-50 text-accent-400 border-accent-100' });
            }
            if (showFlex && isBlackout && dayOfWeek === 5) {
              events.push({ label: 'Blackout', color: 'bg-slate-950 text-white border-slate-800' });
            }
            if (showPaydays && isPayday) {
              events.push({ label: 'Payday', color: 'bg-success-100 text-success-600 border-success-200' });
            }

            return (
              <div key={dateStr}
                className={`min-h-[80px] border-b border-r border-surface-border-subtle p-1 ${
                  isWeekend ? 'bg-surface-dark/50' : ''
                } ${isToday ? 'ring-2 ring-inset ring-primary-400' : ''}`}
              >
                <div className={`text-xs mb-0.5 ${isToday ? 'font-bold text-primary-400' : isWeekend ? 'text-slate-600' : 'text-slate-400'}`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-0.5">
                  {events.map((e, i) => (
                    <div key={i} className={`text-[9px] leading-tight px-1 py-0.5 rounded border truncate ${e.color}`}>
                      {e.label}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Month Quick Nav */}
      <div className="flex flex-wrap gap-1 justify-center">
        {Array.from({ length: 12 }, (_, i) => (
          <button key={i} onClick={() => setCurrentMonth(new Date(2026, i))}
            className={`text-xs px-2 py-1 rounded-lg transition-colors ${
              currentMonth.getMonth() === i
                ? 'bg-primary-600 text-white'
                : 'bg-surface-light text-slate-400 hover:bg-surface-elevated'
            }`}>
            {format(new Date(2026, i), 'MMM')}
          </button>
        ))}
      </div>
    </div>
  );
}
