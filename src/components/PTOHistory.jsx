import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Plus, Pencil, Trash2, X, Check, Filter } from 'lucide-react';
import { usePTO } from '../contexts/PTOContext';
import { assignPool } from '../utils/ptoCalculations';
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
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
          <input type="date" value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Hours</label>
          <input type="number" value={form.hours} min="1" max="10" step="1"
            onChange={e => setForm(f => ({ ...f, hours: Number(e.target.value) }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
          <select value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
          >
            <option value="Planned">Planned</option>
            <option value="Unplanned">Unplanned</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
          <select value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
          >
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Pool</label>
          <select value={form.pool}
            onChange={e => setForm(f => ({ ...f, pool: e.target.value }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
          >
            <option value="granted">Granted PTO</option>
            <option value="purchased">Purchased PTO</option>
            <option value="floating">Floating Holiday</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Reason / Notes</label>
        <input type="text" value={form.reason} placeholder="e.g., Vacation, Doctor appt..."
          onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel}
          className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
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

  const totals = useMemo(() => {
    const all = absences;
    return {
      totalHours: all.reduce((s, a) => s + a.hours, 0),
      totalDays: all.reduce((s, a) => s + a.hours, 0) / PTO_CONFIG.hoursPerDay,
      granted: all.filter(a => a.pool === 'granted').reduce((s, a) => s + a.hours, 0),
      purchased: all.filter(a => a.pool === 'purchased').reduce((s, a) => s + a.hours, 0),
      floating: all.filter(a => a.pool === 'floating').reduce((s, a) => s + a.hours, 0),
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
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
          <p className="text-2xl font-bold text-slate-800">{totals.totalHours}h</p>
          <p className="text-xs text-slate-400">{totals.totalDays} days used</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
          <p className="text-2xl font-bold text-primary-700">{totals.planned}h</p>
          <p className="text-xs text-slate-400">Planned</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
          <p className="text-2xl font-bold text-warning-600">{totals.unplanned}h</p>
          <p className="text-xs text-slate-400">Unplanned</p>
        </div>
      </div>

      {/* Pool Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-600 mb-2">Usage by Pool</h3>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary-500" />
            <span className="text-slate-600">Granted: {totals.granted}h</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-accent-500" />
            <span className="text-slate-600">Purchased: {totals.purchased}h</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-success-500" />
            <span className="text-slate-600">Floating: {totals.floating}h</span>
          </div>
        </div>
      </div>

      {/* Filters + Add Button */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <select value={filterPool} onChange={e => setFilterPool(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-600">
            <option value="all">All Pools</option>
            <option value="granted">Granted</option>
            <option value="purchased">Purchased</option>
            <option value="floating">Floating</option>
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-600">
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
            <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-slate-50 flex flex-col items-center justify-center border border-slate-100">
                  <span className="text-[10px] font-medium text-slate-500 leading-none uppercase">
                    {format(parseISO(a.date), 'MMM')}
                  </span>
                  <span className="text-lg font-bold text-slate-800 leading-none">
                    {format(parseISO(a.date), 'd')}
                  </span>
                  <span className="text-[9px] text-slate-400 leading-none">
                    {format(parseISO(a.date), 'EEE')}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">{a.reason || 'No reason'}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-400">{a.hours}h</span>
                    <span className="text-xs text-slate-300">|</span>
                    <span className="text-xs text-slate-400">{a.type}</span>
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
                  className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => { if (confirm('Delete this absence?')) deleteAbsence(a.id); }}
                  className="p-1.5 text-slate-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )
        ))}
        {sorted.length === 0 && (
          <p className="text-center text-slate-400 py-8 text-sm">No absences recorded yet</p>
        )}
      </div>
    </div>
  );
}
