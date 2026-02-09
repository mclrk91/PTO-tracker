import { useState } from 'react';
import { Cloud, CloudOff, Check, RefreshCw, Unlink, Shield, Smartphone } from 'lucide-react';
import { usePTO } from '../contexts/PTOContext';

export default function Settings() {
  const { syncCode, syncStatus, lastSynced, setSyncCode, disconnectSync } = usePTO();
  const [inputCode, setInputCode] = useState(syncCode);
  const [showHelp, setShowHelp] = useState(false);

  const statusConfig = {
    disconnected: { color: 'text-slate-400', bg: 'bg-slate-100', label: 'Not connected', icon: CloudOff },
    connecting: { color: 'text-warning-500', bg: 'bg-warning-50', label: 'Connecting...', icon: RefreshCw },
    synced: { color: 'text-success-600', bg: 'bg-success-50', label: 'Synced', icon: Cloud },
    error: { color: 'text-danger-500', bg: 'bg-danger-50', label: 'Connection error', icon: CloudOff },
  };

  const status = statusConfig[syncStatus];
  const StatusIcon = status.icon;

  const handleConnect = () => {
    if (inputCode.trim().length < 4) return;
    setSyncCode(inputCode.trim());
  };

  const handleDisconnect = () => {
    if (confirm('Disconnect sync? Your data will still be saved locally on this device.')) {
      disconnectSync();
      setInputCode('');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Settings</h2>
        <p className="text-xs text-slate-500">Manage cross-device sync and app preferences</p>
      </div>

      {/* Sync Status */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Cloud size={16} className="text-primary-500" />
            Cross-Device Sync
          </h3>
          <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${status.bg} ${status.color}`}>
            <StatusIcon size={12} className={syncStatus === 'connecting' ? 'animate-spin' : ''} />
            {status.label}
          </span>
        </div>

        {syncStatus === 'synced' && syncCode && (
          <div className="mb-4 p-3 bg-success-50 border border-success-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-success-600">Connected with sync code</p>
                <p className="text-xs text-success-600/70 mt-0.5 font-mono">
                  {syncCode.slice(0, 3)}{'*'.repeat(Math.max(0, syncCode.length - 6))}{syncCode.slice(-3)}
                </p>
                {lastSynced && (
                  <p className="text-[10px] text-success-600/50 mt-1">
                    Last synced: {lastSynced.toLocaleTimeString()}
                  </p>
                )}
              </div>
              <button onClick={handleDisconnect}
                className="flex items-center gap-1 px-2 py-1 text-xs text-danger-500 bg-white border border-danger-200 rounded-lg hover:bg-danger-50 transition-colors">
                <Unlink size={12} /> Disconnect
              </button>
            </div>
          </div>
        )}

        {syncStatus !== 'synced' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Enter a secret sync code to keep your PTO data synced across devices.
              Use the same code on your phone, tablet, and computer.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputCode}
                onChange={e => setInputCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleConnect()}
                placeholder="Enter a secret sync code..."
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
              <button onClick={handleConnect}
                disabled={inputCode.trim().length < 4}
                className="flex items-center gap-1 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <Check size={14} /> Connect
              </button>
            </div>
            {syncStatus === 'error' && (
              <p className="text-xs text-danger-500">
                Failed to connect. Check your internet connection and try again.
              </p>
            )}
          </div>
        )}
      </div>

      {/* How Sync Works */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <button onClick={() => setShowHelp(!showHelp)}
          className="w-full text-left text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Shield size={16} className="text-primary-500" />
          How does sync work?
        </button>
        {showHelp && (
          <div className="mt-3 space-y-2 text-xs text-slate-500">
            <p>
              Your PTO data is stored in a cloud database, keyed by a hash of your sync code.
              Anyone with the same sync code can read and write that data — so pick something
              unique and memorable that only you know.
            </p>
            <p>
              <strong>Good sync codes:</strong> "marissa-pto-2026-bsb", "my-pto-tracker-secret-123"
            </p>
            <p>
              <strong>Bad sync codes:</strong> "password", "1234", "test"
            </p>
            <p>
              Your data is also always saved locally on each device, so it works offline too.
              When you come back online, changes will sync automatically.
            </p>
          </div>
        )}
      </div>

      {/* PWA Install Hint */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2">
          <Smartphone size={16} className="text-primary-500" />
          Install on iPhone
        </h3>
        <div className="text-xs text-slate-500 space-y-1.5">
          <p>To add this app to your iPhone home screen:</p>
          <ol className="list-decimal pl-4 space-y-1">
            <li>Open this page in <strong>Safari</strong></li>
            <li>Tap the <strong>Share</strong> button (square with arrow)</li>
            <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
            <li>Tap <strong>"Add"</strong></li>
          </ol>
          <p className="text-slate-400 mt-2">
            The app will appear as an icon on your home screen and open full-screen like a native app.
          </p>
        </div>
      </div>

      {/* About */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
        <p className="text-xs text-slate-400">
          PTO Tracker — Marissa Clark — 2026
        </p>
        <p className="text-[10px] text-slate-300 mt-1">
          Data stored locally + Firebase Realtime Database
        </p>
      </div>
    </div>
  );
}
