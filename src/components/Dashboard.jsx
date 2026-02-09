import { useMemo } from 'react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { TrendingUp, AlertTriangle, CalendarCheck, ChevronRight } from 'lucide-react';
import { usePTO } from '../contexts/PTOContext';
import { calculateBalances, calculateYearEndForecast, getNextFlexFriday, getNextPayday } from '../utils/ptoCalculations';
import { PTO_CONFIG } from '../data/constants';

function BalanceCard({ title, balance, total, used, color, subtitle, children }) {
  const pct = total > 0 ? ((total - balance) / total) * 100 : 0;
  const colorMap = {
    blue: { bg: 'bg-primary-50', border: 'border-primary-200', text: 'text-primary-400', bar: 'bg-primary-500' },
    orange: { bg: 'bg-accent-50', border: 'border-accent-200', text: 'text-accent-400', bar: 'bg-accent-500' },
    green: { bg: 'bg-success-50', border: 'border-success-500/20', text: 'text-success-600', bar: 'bg-success-500' },
    slate: { bg: 'bg-surface', border: 'border-surface-border', text: 'text-slate-200', bar: 'bg-slate-500' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-4 card-hover`}>
      <h3 className="text-sm font-semibold text-slate-200 mb-2">{title}</h3>
      <div className="flex items-baseline gap-1 mb-1">
        <span className={`text-3xl font-bold ${c.text}`}>{balance.toFixed(1)}</span>
        <span className="text-sm text-slate-500">hrs</span>
      </div>
      {subtitle && <p className="text-xs text-slate-400 mb-2">{subtitle}</p>}
      <div className="w-full bg-white/10 rounded-full h-2 mb-1">
        <div className={`${c.bar} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>{used.toFixed(1)}h used</span>
        <span>{total.toFixed(1)}h total</span>
      </div>
      {children}
    </div>
  );
}

function AlertCard({ type, title, message }) {
  const styles = {
    warning: 'bg-warning-50 border-warning-500/20 text-warning-600',
    danger: 'bg-danger-50 border-danger-500/20 text-danger-600',
    info: 'bg-primary-50 border-primary-200 text-primary-700',
    success: 'bg-success-50 border-success-500/20 text-success-600',
  };
  return (
    <div className={`border rounded-lg p-3 ${styles[type]}`}>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs opacity-80 mt-0.5">{message}</p>
    </div>
  );
}

export default function Dashboard() {
  const { absences } = usePTO();
  const today = format(new Date(), 'yyyy-MM-dd');
  const currentMonth = new Date().getMonth(); // 0-indexed, so Oct = 9

  const balances = useMemo(() => calculateBalances(absences, today), [absences, today]);
  const forecast = useMemo(() => calculateYearEndForecast(absences), [absences]);
  const nextFlex = useMemo(() => getNextFlexFriday(absences), [absences]);
  const nextPayday = getNextPayday();

  const daysUntilPayday = nextPayday
    ? differenceInDays(parseISO(nextPayday), new Date())
    : null;

  const upcomingPTO = absences
    .filter(a => a.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  const pastPTO = absences
    .filter(a => a.date < today)
    .sort((a, b) => b.date.localeCompare(a.date));

  const pastPTOTotal = pastPTO.reduce((sum, a) => sum + a.hours, 0);

  const poolLabel = (pool) => {
    if (pool === 'purchased') return 'Purchased';
    if (pool === 'floating') return 'Floating';
    return 'PTO';
  };

  // Only show forfeiture/at-risk alerts starting in October
  const alerts = useMemo(() => {
    const list = [];
    if (currentMonth >= 9 && forecast.purchasedForfeited > 0) {
      list.push({
        type: 'warning',
        title: `${forecast.purchasedForfeited}h purchased PTO at risk`,
        message: 'Purchased PTO cannot carry over to 2027. Plan to use it or request a cash-out during enrollment.',
      });
    }
    if (balances.granted.balance < 0) {
      list.push({
        type: 'danger',
        title: 'Negative PTO balance',
        message: `You've borrowed ${Math.abs(balances.granted.balance).toFixed(1)}h. This will carry over as a negative balance if not resolved.`,
      });
    }
    return list;
  }, [forecast, balances, currentMonth]);

  return (
    <div className="space-y-4">
      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <BalanceCard
          title="⏰ Granted PTO"
          balance={balances.granted.balance}
          total={balances.granted.total}
          used={balances.granted.used}
          color="blue"
          subtitle={`${balances.granted.carryover}h carryover + ${balances.granted.accrued.toFixed(1)}h accrued`}
        />
        <BalanceCard
          title="💰 Purchased PTO"
          balance={balances.purchased.balance}
          total={balances.purchased.total}
          used={balances.purchased.used}
          color="orange"
          subtitle="Use after granted PTO is exhausted"
        />
        <BalanceCard
          title="🎁 Floating Holiday"
          balance={balances.floating.balance}
          total={balances.floating.total}
          used={balances.floating.used}
          color="green"
          subtitle="Use anytime in 2026"
        />
        <BalanceCard
          title="✅ Total Available"
          balance={balances.combined.balance}
          total={balances.combined.total}
          used={balances.combined.used}
          color="slate"
          subtitle={`${(balances.combined.balance / PTO_CONFIG.hoursPerDay).toFixed(1)} days remaining`}
        />
      </div>

      {/* Alerts — only shown when relevant */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">⚠️ Alerts</h2>
          {alerts.map((alert, i) => (
            <AlertCard key={i} {...alert} />
          ))}
        </div>
      )}

      {/* Quick Info Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Next Accrual */}
        <div className="bg-surface rounded-xl border border-surface-border p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">📈 Next Accrual</h3>
          {nextPayday ? (
            <div>
              <p className="text-lg font-bold text-slate-100">
                +{PTO_CONFIG.accrualPerPayPeriod}h
                <span className="text-sm font-normal text-slate-400 ml-2">
                  on {format(parseISO(nextPayday), 'MMM d')}
                </span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {daysUntilPayday === 0 ? 'Today!' : daysUntilPayday === 1 ? 'Tomorrow' : `In ${daysUntilPayday} days`}
                {' — '}accrues every 2 weeks ({PTO_CONFIG.accrualPerPayPeriod}h/period)
              </p>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No more pay periods this year</p>
          )}
        </div>

        {/* Next Flex Friday */}
        <div className="bg-surface rounded-xl border border-surface-border p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">📅 Next Flex Friday</h3>
          {nextFlex ? (
            <div>
              <p className="text-lg font-bold text-slate-100">
                {format(parseISO(nextFlex.date), 'EEEE, MMM d')}
              </p>
              <p className={`text-xs mt-1 ${nextFlex.available ? 'text-success-600' : 'text-danger-500'}`}>
                {nextFlex.available
                  ? 'Available — no PTO scheduled Mon-Thu that week'
                  : 'Not available — PTO taken during flex week (must work 4x10)'}
              </p>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No more flex Fridays this year</p>
          )}
        </div>
      </div>

      {/* Year-End Forecast */}
      <div className="bg-surface rounded-xl border border-surface-border p-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">🔮 Year-End Forecast (12/31/2026)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-500">Total Annual Accruals</p>
            <p className="text-lg font-bold text-slate-200">{forecast.totalAccrualsYear.toFixed(1)}h</p>
            <p className="text-xs text-slate-500">{(forecast.totalAccrualsYear / 8).toFixed(1)} days</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Projected Year-End Balance</p>
            <p className="text-lg font-bold text-primary-400">{forecast.totalYearEnd.toFixed(1)}h</p>
            <p className="text-xs text-slate-500">{(forecast.totalYearEnd / 8).toFixed(1)} days</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Carryover to 2027</p>
            <p className="text-lg font-bold text-success-600">{forecast.carryoverTo2027.toFixed(1)}h</p>
            <p className="text-xs text-slate-500">Max {PTO_CONFIG.maxCarryover}h</p>
          </div>
        </div>
      </div>

      {/* Past PTO — Days Already Taken */}
      {pastPTO.length > 0 && (
        <div className="bg-surface rounded-xl border border-surface-border p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-1">📋 Days Already Taken</h3>
          <p className="text-xs text-slate-500 mb-3">{pastPTOTotal}h total ({(pastPTOTotal / PTO_CONFIG.hoursPerDay).toFixed(1)} days)</p>
          <div className="space-y-2">
            {pastPTO.map(a => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-surface-border-subtle last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-dark flex flex-col items-center justify-center">
                    <span className="text-[10px] font-medium text-slate-400 leading-none">
                      {format(parseISO(a.date), 'MMM')}
                    </span>
                    <span className="text-sm font-bold text-slate-200 leading-none">
                      {format(parseISO(a.date), 'd')}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{a.reason || 'PTO'}</p>
                    <p className="text-xs text-slate-500">{a.hours}h — {poolLabel(a.pool)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming PTO */}
      {upcomingPTO.length > 0 && (
        <div className="bg-surface rounded-xl border border-surface-border p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">✈️ Upcoming Time Off</h3>
          <div className="space-y-2">
            {upcomingPTO.slice(0, 5).map(a => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-surface-border-subtle last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-medium text-primary-400 leading-none">
                      {format(parseISO(a.date), 'MMM')}
                    </span>
                    <span className="text-sm font-bold text-primary-300 leading-none">
                      {format(parseISO(a.date), 'd')}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{a.reason}</p>
                    <p className="text-xs text-slate-500">{a.hours}h — {poolLabel(a.pool)}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  a.status === 'Scheduled' ? 'bg-primary-100 text-primary-700' :
                  a.status === 'Completed' ? 'bg-success-100 text-success-600' :
                  'bg-warning-100 text-warning-600'
                }`}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PTO Rules Quick Reference */}
      <details className="bg-surface rounded-xl border border-surface-border p-4">
        <summary className="text-sm font-semibold text-slate-300 cursor-pointer flex items-center gap-2">
          <ChevronRight size={16} className="transition-transform details-open:rotate-90" />
          📖 PTO Rules Quick Reference
        </summary>
        <div className="mt-3 space-y-2 text-xs text-slate-400">
          <p><strong>Usage order:</strong> Granted PTO (carryover + accruals) must be exhausted before Purchased PTO can be used.</p>
          <p><strong>Accrual:</strong> {PTO_CONFIG.accrualPerPayPeriod}h per pay period, granted on Saturday ending each pay period.</p>
          <p><strong>Carryover:</strong> Up to {PTO_CONFIG.maxCarryover}h of granted PTO carries to next year.</p>
          <p><strong>Purchased PTO:</strong> Cannot carry over. Request cash-out during annual enrollment if unused.</p>
          <p><strong>Borrowing:</strong> Can borrow up to {PTO_CONFIG.maxBorrow}h with manager approval.</p>
          <p><strong>Floating holiday:</strong> 1 day (8h), use anytime in 2026.</p>
          <p><strong>Flex Friday:</strong> Must work 4x10h days Mon-Thu. Not available if any PTO taken during flex week.</p>
        </div>
      </details>
    </div>
  );
}
