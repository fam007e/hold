import { useState } from 'react';
import { Clock, AlertTriangle, CheckCircle, ArrowUpCircle, Lock, Unlock, Download, Upload } from 'lucide-react';
import { useHolds } from '@/lib/HoldsContext';
import { useAuth } from '@/lib/AuthContext'; // Import useAuth
import { HoldCard } from '@/components';
import { calculateUrgency } from '@/lib/utils';
import { downloadFile } from '@/lib/integrations';
import './Dashboard.css';

export function Dashboard() {
  const { holds, loading } = useHolds();
  const { isLocked, unlock } = useAuth(); // Get lock state and unlock function
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlocking(true);
    setUnlockError('');
    try {
      await unlock(unlockPassword);
      setUnlockPassword('');
    } catch {
      setUnlockError('Incorrect password');
    } finally {
      setUnlocking(false);
    }
  };

  const handleExport = () => {
    const data = JSON.stringify(holds, null, 2);
    downloadFile(data, `hold-backup-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        if (Array.isArray(importedData)) {
          alert("Data imported successfully! In a full implementation, this would merge with your existing vault.");
        }
      } catch {
        alert("Invalid backup file.");
      }
    };
    reader.readAsText(file);
  };

  if (loading && !isLocked) {
    return (
      <div className="dashboard">
        <div className="dashboard__loading">
          <div className="dashboard__spinner" />
          <p>Loading your holds...</p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const stats = {
    pending: holds.filter(h => h.status === 'pending').length,
    overdue: holds.filter(h => h.status === 'overdue').length,
    escalated: holds.filter(h => h.status === 'escalated').length,
    resolved: holds.filter(h => h.status === 'resolved').length,
  };

  // Sort holds by urgency (most urgent first), excluding resolved
  const activeHolds = holds
    .filter(h => h.status !== 'resolved')
    .sort((a, b) => calculateUrgency(b) - calculateUrgency(a));

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <h1 className="dashboard__title">What's Blocking You</h1>
        <p className="dashboard__subtitle">
          {activeHolds.length === 0
            ? "You're all clear! No pending items."
            : `${activeHolds.length} pending ${activeHolds.length === 1 ? 'item' : 'items'} waiting for resolution`
          }
        </p>
        <div className="dashboard__actions">
          <button className="dashboard__action-btn" onClick={handleExport} title="Export Vault">
            <Download size={18} />
            <span>Export</span>
          </button>
          <label className="dashboard__action-btn" title="Import Vault">
            <Upload size={18} />
            <span>Import</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </header>

      {/* Unlock Vault UI */}
      {isLocked && (
        <div className="dashboard__locked-banner" style={{
          background: '#fee2e2',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991b1b' }}>
            <Lock size={20} />
            <span style={{ fontWeight: 600 }}>Vault Locked</span>
            <span style={{ fontSize: '0.9rem' }}> - Re-enter password to decrypt your data</span>
          </div>

          <form onSubmit={handleUnlock} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="password"
              placeholder="Enter password to unlock"
              value={unlockPassword}
              onChange={(e) => setUnlockPassword(e.target.value)}
              style={{
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                flex: 1
              }}
            />
            <button
              type="submit"
              disabled={unlocking}
              style={{
                background: '#dc2626',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: unlocking ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {unlocking ? 'Unlocking...' : <><Unlock size={16} /> Unlock</>}
            </button>
          </form>
          {unlockError && <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: 0 }}>{unlockError}</p>}
        </div>
      )}

      <div className="dashboard__stats">
        <div className="dashboard__stat dashboard__stat--pending">
          <Clock size={20} />
          <span className="dashboard__stat-value">{stats.pending}</span>
          <span className="dashboard__stat-label">Pending</span>
        </div>
        <div className="dashboard__stat dashboard__stat--overdue">
          <AlertTriangle size={20} />
          <span className="dashboard__stat-value">{stats.overdue}</span>
          <span className="dashboard__stat-label">Overdue</span>
        </div>
        <div className="dashboard__stat dashboard__stat--escalated">
          <ArrowUpCircle size={20} />
          <span className="dashboard__stat-value">{stats.escalated}</span>
          <span className="dashboard__stat-label">Escalated</span>
        </div>
        <div className="dashboard__stat dashboard__stat--resolved">
          <CheckCircle size={20} />
          <span className="dashboard__stat-value">{stats.resolved}</span>
          <span className="dashboard__stat-label">Resolved</span>
        </div>
      </div>

      {activeHolds.length > 0 && (
        <section className="dashboard__section">
          <h2 className="dashboard__section-title">
            {stats.overdue > 0 ? 'Needs Your Attention' : 'Active Holds'}
          </h2>
          <div className="dashboard__holds">
            {activeHolds.map(hold => (
              <HoldCard key={hold.id} hold={hold} />
            ))}
          </div>
        </section>
      )}

      {holds.filter(h => h.status === 'resolved').length > 0 && (
        <section className="dashboard__section dashboard__section--resolved">
          <h2 className="dashboard__section-title">Recently Resolved</h2>
          <div className="dashboard__holds">
            {holds
              .filter(h => h.status === 'resolved')
              .slice(0, 3)
              .map(hold => (
                <HoldCard key={hold.id} hold={hold} />
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
