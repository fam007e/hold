import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Trash2,
  Check,
  AlertTriangle,
  Paperclip,
  Banknote,
  HeartPulse,
  Landmark,
  Briefcase,
  GraduationCap,
  User,
} from 'lucide-react';
import { useHolds } from '@/lib/HoldsContext';
import { StatusBadge, Timeline, FollowUpGenerator } from '@/components';
import { CATEGORY_INFO, type HoldCategory } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { useState } from 'react';
import './HoldDetail.css';

const CATEGORY_ICONS: Record<HoldCategory, React.ReactNode> = {
  finance: <Banknote size={24} />,
  healthcare: <HeartPulse size={24} />,
  government: <Landmark size={24} />,
  work: <Briefcase size={24} />,
  education: <GraduationCap size={24} />,
  personal: <User size={24} />,
};

export function HoldDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getHold, deleteHold, resolveHold, updateStatus } = useHolds();
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolution, setResolution] = useState({ outcome: '', notes: '' });

  const hold = getHold(id!);

  if (!hold) {
    return (
      <div className="hold-detail">
        <div className="hold-detail__not-found">
          <h2>Hold not found</h2>
          <Link to="/" className="hold-detail__back-btn">
            <ArrowLeft size={20} />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const categoryInfo = CATEGORY_INFO[hold.category];

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this hold?')) {
      await deleteHold(hold.id);
      navigate('/');
    }
  };

  const handleResolve = async () => {
    if (resolution.outcome.trim()) {
      await resolveHold(hold.id, resolution.outcome, resolution.notes);
      setShowResolveModal(false);
    }
  };

  const handleEscalate = async () => {
    await updateStatus(hold.id, 'escalated');
  };

  return (
    <div className="hold-detail">
      <header className="hold-detail__header">
        <Link to="/" className="hold-detail__back">
          <ArrowLeft size={20} />
          <span>Back</span>
        </Link>

        <div className="hold-detail__actions">
          {hold.status !== 'resolved' && (
            <>
              {hold.status !== 'escalated' && (
                <button
                  className="hold-detail__action hold-detail__action--escalate"
                  onClick={handleEscalate}
                >
                  <AlertTriangle size={18} />
                  Escalate
                </button>
              )}
              <button
                className="hold-detail__action hold-detail__action--resolve"
                onClick={() => setShowResolveModal(true)}
              >
                <Check size={18} />
                Resolve
              </button>
            </>
          )}
          <button
            className="hold-detail__action hold-detail__action--delete"
            onClick={handleDelete}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      <div className="hold-detail__content">
        <div className="hold-detail__main">
          <div className="hold-detail__title-row">
            <div
              className="hold-detail__icon"
              style={{ background: `${categoryInfo.color}20`, color: categoryInfo.color }}
            >
              {CATEGORY_ICONS[hold.category]}
            </div>
            <div>
              <span className="hold-detail__category">{categoryInfo.label}</span>
              <h1 className="hold-detail__title">{hold.title}</h1>
            </div>
            <StatusBadge status={hold.status} />
          </div>

          <p className="hold-detail__counterparty">
            Waiting on: <strong>{hold.counterparty}</strong>
          </p>

          <div className="hold-detail__timeline-section">
            <h3>Timeline</h3>
            <Timeline hold={hold} />
          </div>

          <div className="hold-detail__info-grid">
            <div className="hold-detail__info">
              <span className="hold-detail__info-label">Started</span>
              <span className="hold-detail__info-value">{formatDate(hold.startDate)}</span>
            </div>
            <div className="hold-detail__info">
              <span className="hold-detail__info-label">Expected Resolution</span>
              <span className="hold-detail__info-value">{hold.expectedResolutionDays} days</span>
            </div>
            <div className="hold-detail__info">
              <span className="hold-detail__info-label">Follow-ups Sent</span>
              <span className="hold-detail__info-value">{hold.followUps.length}</span>
            </div>
            <div className="hold-detail__info">
              <span className="hold-detail__info-label">Attachments</span>
              <span className="hold-detail__info-value">
                <Paperclip size={14} />
                {hold.attachments.length}
              </span>
            </div>
          </div>

          {hold.notes && (
            <div className="hold-detail__notes">
              <h3>Notes</h3>
              <p>{hold.notes}</p>
            </div>
          )}

          {hold.resolution && (
            <div className="hold-detail__resolution">
              <h3>Resolution</h3>
              <div className="hold-detail__resolution-content">
                <p><strong>Outcome:</strong> {hold.resolution.outcome}</p>
                <p><strong>Resolved on:</strong> {formatDate(hold.resolution.date)}</p>
                <p><strong>Time waited:</strong> {hold.resolution.timeWaitedDays} days</p>
                {hold.resolution.notes && <p><strong>Notes:</strong> {hold.resolution.notes}</p>}
              </div>
            </div>
          )}
        </div>

        <div className="hold-detail__sidebar">
          {hold.status !== 'resolved' && (
            <FollowUpGenerator hold={hold} />
          )}
        </div>
      </div>

      {showResolveModal && (
        <div className="hold-detail__modal-overlay" onClick={() => setShowResolveModal(false)}>
          <div className="hold-detail__modal" onClick={e => e.stopPropagation()}>
            <h2>Mark as Resolved</h2>
            <div className="hold-detail__modal-field">
              <label>Outcome *</label>
              <input
                type="text"
                placeholder="e.g., Refund received, Application approved"
                value={resolution.outcome}
                onChange={e => setResolution(prev => ({ ...prev, outcome: e.target.value }))}
              />
            </div>
            <div className="hold-detail__modal-field">
              <label>Notes (optional)</label>
              <textarea
                placeholder="Any additional notes..."
                value={resolution.notes}
                onChange={e => setResolution(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            <div className="hold-detail__modal-actions">
              <button
                className="hold-detail__modal-cancel"
                onClick={() => setShowResolveModal(false)}
              >
                Cancel
              </button>
              <button
                className="hold-detail__modal-confirm"
                onClick={handleResolve}
                disabled={!resolution.outcome.trim()}
              >
                <Check size={18} />
                Mark Resolved
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
