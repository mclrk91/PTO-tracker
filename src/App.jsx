import { useState } from 'react';
import { LayoutDashboard, Calendar, History, FlaskConical, CalendarRange, Sparkles, Settings2 } from 'lucide-react';
import Dashboard from './components/Dashboard';
import PTOHistory from './components/PTOHistory';
import PTOPlanner from './components/PTOPlanner';
import FlexFriday from './components/FlexFriday';
import UnifiedCalendar from './components/UnifiedCalendar';
import LongWeekends from './components/LongWeekends';
import Settings from './components/Settings';
import { usePTO } from './contexts/PTOContext';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, shortLabel: 'Home' },
  { id: 'history', label: 'PTO History', icon: History, shortLabel: 'History' },
  { id: 'planner', label: 'Planner', icon: FlaskConical, shortLabel: 'Planner' },
  { id: 'calendar', label: 'Calendar', icon: CalendarRange, shortLabel: 'Calendar' },
  { id: 'flex', label: 'Flex Friday', icon: Calendar, shortLabel: 'Flex' },
  { id: 'weekends', label: 'Long Weekends', icon: Sparkles, shortLabel: 'Optimize' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { syncStatus } = usePTO();

  const ActiveComponent = {
    dashboard: Dashboard,
    history: PTOHistory,
    planner: PTOPlanner,
    calendar: UnifiedCalendar,
    flex: FlexFriday,
    weekends: LongWeekends,
    settings: Settings,
  }[activeTab];

  return (
    <div className="flex flex-col h-full bg-surface-dark">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#070d1a] to-surface text-white px-4 py-3 shadow-lg flex-shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">🏖️ PTO Tracker</h1>
            <p className="text-primary-400 text-xs">Marissa Clark — 2026</p>
          </div>
          <div className="flex items-center gap-2">
            {syncStatus === 'synced' && (
              <span className="text-[10px] bg-green-500/20 text-green-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Synced
              </span>
            )}
            <button onClick={() => setActiveTab('settings')}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title="Settings & Sync">
              <Settings2 size={18} className="text-primary-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Tab Bar */}
      <nav className="hidden md:block bg-surface border-b border-surface-border flex-shrink-0">
        <div className="max-w-5xl mx-auto flex">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-400 bg-primary-50/50'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-surface-light'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-4">
        <div className="max-w-5xl mx-auto p-4">
          <div className="tab-content">
            <ActiveComponent />
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-surface-border flex justify-around items-center px-1 py-1 z-50"
        style={{ paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors min-w-0 flex-1 ${
              activeTab === tab.id
                ? 'text-primary-400 bg-primary-50'
                : 'text-slate-500'
            }`}
          >
            <tab.icon size={18} />
            <span className="truncate text-[10px]">{tab.shortLabel}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
