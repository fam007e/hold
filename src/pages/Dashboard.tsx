import { Clock, AlertTriangle, CheckCircle, ArrowUpCircle } from 'lucide-react';
import { useHolds } from '@/lib/HoldsContext';
import { HoldCard } from '@/components';
import { calculateUrgency } from '@/lib/utils';
import './Dashboard.css';

export function Dashboard() {
  const { holds, loading } = useHolds();

  if (loading) {
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
      </header>

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
