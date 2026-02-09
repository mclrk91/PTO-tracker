import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Plus, Pencil, Trash2, X, Check, Filter } from 'lucide-react';
import { usePTO } from '../contexts/PTOContext';
import { assignPool, calculateBalances } from '../utils/ptoCalculations';
import { PTO_CONFIG } from '../data/constants';

function AbsenceForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    date: format(new Date(), 'yyyy-MM-dd'),
    hours: 8,
    type: 'Planned',
    reason: '',
    status: 'Scheduled',
    pool: 'granted',
  });

  return (
    <div className="bg-surface border border-surface-border rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Date</label>
          <input type="date" value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="w-full bg-surface-dark border border-surface-border text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Hours</label>
          <input type="number" value={form.hours} min="1" max="10" step="1"
            onChange={e => setForm(f => ({ ...f, hours: Number(e.target.value) }))}
            className="w-full bg-surface-dark border border-surface-border text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Type</label>
          <select value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            className="w-full bg-surface-dark border border-surface-border text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          >
            <option value="Planned">Planned</option>
            <option value="Unplanned">Unplanned</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
          <select value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            className="w-full bg-surface-dark border border-surface-border text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          >
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Pool</label>
          <select value={form.pool}
            onChange={e => setForm(f => ({ ...f, pool: e.target.value }))}
            className="w-full bg-surface-dark border border-surface-border text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          >
            <option value="granted">Granted PTO</option>
            <option value="purchased">Purchased PTO</option>
            <option value="floating">Floating Holiday</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">Reason / Notes</label>
        <input type="text" value={form.reason} placeholder="e.g., Vacation, Doctor appt..."
          onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
          className="w-full bg-surface-dark border border-surface-border text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none placeholder:text-slate-500"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel}
          className="px-3 py-1.5 text-sm text-slate-400 hover:bg-surface-light rounded-lg transition-colors">
          Cancel
        </button>
        <button onClick={() => onSave(form)}
          className="px-4 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-1">
          <Check size={14} /> Save
        </button>
      </div>
    </div>
  );
}

export default function PTOHistory() {
  const { absences, addAbsence, updateAbsence, deleteAbsence } = usePTO();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterPool, setFilterPool] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const sorted = useMemo(() => {
    return [...absences]
      .filter(a => filterPool === 'all' || a.pool === filterPool)
      .filter(a => filterType === 'all' || a.type === filterType)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [absences, filterPool, filterType]);

  const today = format(new Date(), 'yyyy-MM-dd');
  const balances = useMemo(() => calculateBalances(absences, today), [absences, today]);

  const totals = useMemo(() => {
    const all = absences;
    return {
      totalHours: all.reduce((s, a) => s + a.hours, 0),
      totalDays: all.reduce((s, a) => s + a.hours, 0) / PTO_CONFIG.hoursPerDay,
      planned: all.filter(a => a.type === 'Planned').reduce((s, a) => s + a.hours, 0),
      unplanned: all.filter(a => a.type === 'Unplanned').reduce((s, a) => s + a.hours, 0),
    };
  }, [absences]);

  const handleAdd = (form) => {
    addAbsence(form);
    setShowForm(false);
  };

  const handleUpdate = (form) => {
    updateAbsence(editingId, form);
    setEditingId(null);
  };

  const poolColors = {
    granted: 'bg-primary-100 text-primary-700',
    purchased: 'bg-accent-100 text-accent-500',
    floating: 'bg-success-100 text-success-600',
  };

  const poolLabels = {
    granted: 'Granted',
    purchased: 'Purchased',
    floating: 'Floating',
  };

  return (
    <div className="space-y-4">
      {/* Per-Pool Balance Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { emoji: '⏰', label: 'PTO', pool: balances.granted, color: 'primary', barColor: 'bg-primary-500' },
          { emoji: '💰', label: 'Purchased', pool: balances.purchased, color: 'accent', barColor: 'bg-accent-500' },
          { emoji: '🎁', label: 'Floating', pool: balances.floating, color: 'success', barColor: 'bg-success-500' },
          { emoji: '📊', label: 'Total', pool: balances.combined, color: 'slate', barColor: 'bg-slate-500' },
        ].map(({ emoji, label, pool, color, barColor }) => {
          const pct = pool.total > 0 ? (pool.used / pool.total) * 100 : 0;
          return (
            <div key={label} className="bg-surface rounded-xl border border-surface-border p-3">
              <h4 className="text-xs font-semibold text-slate-400 mb-1">{emoji} {label}</h4>
              <p className={`text-2xl font-bold ${color === 'primary' ? 'text-primary-400' : color === 'accent' ? 'text-accent-500' : color === 'success' ? 'text-success-600' : 'text-slate-200'}`}>
                {pool.balance.toFixed(1)}h
              </p>
              <p className="text-[11px] text-slate-500 mb-2">remaining</p>
              <div className="w-full bg-white/10 rounded-full h-1.5 mb-1.5">
                <div className={`${barColor} h-1.5 rounded-full transition-all duration-500`}
                  style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
              <p className="text-[11px] text-slate-500">
                {pool.used.toFixed(1)}h used of {pool.total.toFixed(1)}h
              </p>
              {label === 'Total' && (
                <div className="mt-2 pt-2 border-t border-surface-border-subtle flex gap-3 text-[10px] text-slate-500">
                  <span>{totals.planned}h planned</span>
                  <span>{totals.unplanned}h unplanned</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Filters + Add Button */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500" />
          <select value={filterPool} onChange={e => setFilterPool(e.target.value)}
            className="text-xs border border-surface-border rounded-lg px-2 py-1 bg-surface-dark text-slate-300">
            <option value="all">All Pools</option>
            <option value="granted">Granted</option>
            <option value="purchased">Purchased</option>
            <option value="floating">Floating</option>
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="text-xs border border-surface-border rounded-lg px-2 py-1 bg-surface-dark text-slate-300">
            <option value="all">All Types</option>
            <option value="Planned">Planned</option>
            <option value="Unplanned">Unplanned</option>
          </select>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors">
          <Plus size={14} /> Add Day
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <AbsenceForm onSave={handleAdd} onCancel={() => setShowForm(false)} />
      )}

      {/* Absence List */}
      <div className="space-y-2">
        {sorted.map(a => (
          editingId === a.id ? (
            <AbsenceForm
              key={a.id}
              initial={a}
              onSave={handleUpdate}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div key={a.id} className="bg-surface rounded-xl border border-surface-border p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-surface-dark flex flex-col items-center justify-center border border-surface-border-subtle">
                  <span className="text-[10px] font-medium text-slate-400 leading-none uppercase">
                    {format(parseISO(a.date), 'MMM')}
                  </span>
                  <span className="text-lg font-bold text-slate-100 leading-none">
                    {format(parseISO(a.date), 'd')}
                  </span>
                  <span className="text-[9px] text-slate-500 leading-none">
                    {format(parseISO(a.date), 'EEE')}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">{a.reason || 'No reason'}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500">{a.hours}h</span>
                    <span className="text-xs text-slate-600">|</span>
                    <span className="text-xs text-slate-500">{a.type}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${poolColors[a.pool]}`}>
                      {poolLabels[a.pool]}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-xs px-2 py-0.5 rounded-full mr-2 ${
                  a.status === 'Completed' ? 'bg-success-100 text-success-600' :
                  a.status === 'Scheduled' ? 'bg-primary-100 text-primary-700' :
                  'bg-warning-100 text-warning-600'
                }`}>
                  {a.status}
                </span>
                <button onClick={() => setEditingId(a.id)}
                  className="p-1.5 text-slate-500 hover:text-primary-400 hover:bg-primary-100 rounded-lg transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => { if (confirm('Delete this absence?')) deleteAbsence(a.id); }}
                  className="p-1.5 text-slate-500 hover:text-danger-500 hover:bg-danger-100 rounded-lg transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )
        ))}
        {sorted.length === 0 && (
          <p className="text-center text-slate-500 py-8 text-sm">No absences recorded yet</p>
        )}
      </div>
    </div>
  );
}
