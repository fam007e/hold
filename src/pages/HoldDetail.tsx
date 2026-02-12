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
  ShieldAlert,
  CheckCircle,
  Calendar,
  FileText,
  Share2,
} from 'lucide-react';
import { useHolds } from '@/lib/HoldsContext';
import { StatusBadge, Timeline, FollowUpGenerator } from '@/components';
import { CATEGORY_INFO, type HoldCategory, type Attachment } from '@/lib/types';
import { formatDate, getSuggestedStatus, calculateRiskScore, getRiskLevel, getBenchmark, getEscalationSteps } from '@/lib/utils';
import { generateICal, downloadFile } from '@/lib/integrations';
import { useAuth } from '@/lib/AuthContext';
import { downloadAttachment } from '@/lib/storage';
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
  const { getHold, deleteHold, resolveHold, updateStatus, contributeToBenchmark } = useHolds();
  const { encryptionKey } = useAuth();
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolution, setResolution] = useState({ outcome: '', notes: '' });
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isContributing, setIsContributing] = useState(false);
  const [contributed, setContributed] = useState(false);

  const handleDownload = async (attachment: Attachment) => {
    if (!encryptionKey) {
      alert('Vault locked. Cannot decrypt file.');
      return;
    }
    setDownloadingId(attachment.id);
    try {
      const url = await downloadAttachment(attachment, encryptionKey);
      // Create temporary link to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.originalName || attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Cleanup after download triggers
    } catch (err) {
      console.error('Download failed', err);
      alert('Failed to decrypt and download file.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleAddToCalendar = () => {
    const hold = getHold(id!);
    if (hold) {
      const ics = generateICal(hold);
      downloadFile(ics, `hold-${hold.id}.ics`, 'text/calendar');
    }
  };

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

  const handleExportPDF = () => {
    window.print();
  };

  const handleBenchmarkContribution = async () => {
    if (!hold.resolution || contributed) return;
    setIsContributing(true);
    try {
      await contributeToBenchmark(hold);
      setContributed(true);
    } catch (err) {
      console.error('Benchmark contribution failed', err);
    } finally {
      setIsContributing(false);
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

  const suggestedStatus = getSuggestedStatus(hold);
  const showEscalationSuggestion = suggestedStatus === 'escalated' && hold.status !== 'escalated';

  const riskScore = calculateRiskScore(hold);
  const riskLevel = getRiskLevel(riskScore);
  const riskColor = riskLevel === 'High' ? '#ef4444' : riskLevel === 'Medium' ? '#f59e0b' : '#10b981';

  // Leverage Engine Data
  const benchmark = getBenchmark(hold.category);
  const escalationSteps = getEscalationSteps(hold.category);
  const daysWaiting = Math.ceil((new Date().getTime() - new Date(hold.startDate).getTime()) / (1000 * 60 * 60 * 24));
  const isBenchmarkOverdue = daysWaiting > benchmark.averageDays;
  const isLegalOverdue = benchmark.legalDeadline ? daysWaiting > benchmark.legalDeadline : false;

  return (
    <div className="hold-detail">
      <header className="hold-detail__header">
        <Link to="/" className="hold-detail__back">
          <ArrowLeft size={20} />
          <span>Back</span>
        </Link>

        <div className="hold-detail__actions">
          <button
            className="hold-detail__action"
            onClick={handleExportPDF}
          >
            <FileText size={18} />
            Export Case
          </button>
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

      {showEscalationSuggestion && (
        <div className="hold-detail__suggestion-banner" style={{
          background: '#fff7ed',
          border: '1px solid #f97316',
          borderRadius: '8px',
          padding: '1rem',
          margin: '0 auto 1.5rem',
          maxWidth: '800px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          color: '#c2410c'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <AlertTriangle size={24} />
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Recommendation: Escalate this Hold</h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
                This item is overdue and you've sent multiple follow-ups. We recommend escalating to a manager.
              </p>
            </div>
          </div>
          <button
            onClick={handleEscalate}
            style={{
              background: '#ea580c',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Apply Escalation
          </button>
        </div>
      )}

      {hold._isTampered && (
        <div className="hold-detail__tampered-banner" style={{
          background: '#fee2e2',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          padding: '1rem',
          margin: '0 auto 1.5rem',
          maxWidth: '800px',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          color: '#991b1b'
        }}>
          <ShieldAlert size={24} />
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Security Alert: Data Integrity Compromised</h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
              The digital signature for this record does not match its content. This data may have been tampered with or corrupted.
            </p>
          </div>
        </div>
      )}

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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
              <StatusBadge status={hold.status} />
              <button
                className="hold-detail__calendar-btn"
                onClick={handleAddToCalendar}
                title="Add to Calendar"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.4rem 0.6rem',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#475569',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Calendar size={14} />
                <span>Add to Calendar</span>
              </button>
            </div>
          </div>

          {hold.status !== 'resolved' && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              background: `${riskColor}10`,
              borderRadius: '8px',
              border: `1px solid ${riskColor}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <ShieldAlert size={20} color={riskColor} />
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Delay Risk Score</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: riskColor }}>{riskScore} - {riskLevel}</div>
                </div>
              </div>
              <div style={{ width: '120px', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(riskScore, 10) * 10}%`, height: '100%', background: riskColor }}></div>
              </div>
            </div>
          )}

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
                {hold.attachments && hold.attachments.length > 0 ? (
                  <div className="hold-detail__attachment-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {hold.attachments.map(att => (
                      <button
                        key={att.id}
                        onClick={() => handleDownload(att)}
                        disabled={downloadingId === att.id}
                        className="hold-detail__attachment-btn"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          background: '#f3f4f6',
                          border: '1px solid #e5e7eb',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          color: '#374151'
                        }}
                      >
                        <Paperclip size={14} />
                        <span style={{ textDecoration: 'underline' }}>{att.originalName}</span>
                        {downloadingId === att.id && <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>(Decrypting...)</span>}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: '#9ca3af' }}>None</span>
                )}
              </span>
            </div>
          </div>

          {hold.notes && (
            <div className="hold-detail__notes">
              <h3>Notes</h3>
              <p>{hold.notes}</p>
            </div>
          )}

          {hold.status === 'resolved' ? (
            <div className="hold-detail__resolution">
              <h3>
                <CheckCircle size={20} />
                Resolved on {formatDate(hold.resolution?.date || new Date())}
              </h3>
              <div className="hold-detail__resolution-outcome">
                <span className={`outcome-badge ${hold.resolution?.outcome}`}>
                  {hold.resolution?.outcome}
                </span>
              </div>
              {hold.resolution?.notes && <p>{hold.resolution.notes}</p>}

              {hold.resolution && !contributed && (
                <div className="hold-detail__benchmark-card" style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#0369a1' }}>Anonymous Contribution</h4>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#075985' }}>
                      Help others by sharing only your wait time ({Math.ceil((hold.resolution.date.getTime() - hold.startDate.getTime()) / (1000 * 3600 * 24))} days). No PII shared.
                    </p>
                  </div>
                  <button
                    onClick={handleBenchmarkContribution}
                    disabled={isContributing}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      background: '#0ea5e9',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Share2 size={16} />
                    {isContributing ? 'Sharing...' : 'Share Data'}
                  </button>
                </div>
              )}
              {contributed && (
                <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={16} />
                  <span>Thank you! Your anonymous data has been shared.</span>
                </div>
              )}
            </div>
          ) : (
            <>
              <div style={{
                marginTop: '1.5rem',
                padding: '1.25rem',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px'
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#334155', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldAlert size={18} color="#475569" />
                  Leverage Engine
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Time Elapsed</span>
                    <div style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1e293b' }}>
                      {daysWaiting} Days
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Industry Std</span>
                    <div style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1e293b' }}>
                      ~{benchmark.averageDays} Days
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '0.75rem',
                  borderRadius: '6px',
                  background: isBenchmarkOverdue ? '#fef2f2' : '#f0fdf4',
                  color: isBenchmarkOverdue ? '#b91c1c' : '#15803d',
                  fontSize: '0.875rem',
                  marginBottom: '0.75rem',
                  border: `1px solid ${isBenchmarkOverdue ? '#fecaca' : '#bbf7d0'}`
                }}>
                  {isBenchmarkOverdue
                    ? `⚠️ Wait time is ${Math.round(((daysWaiting - benchmark.averageDays) / benchmark.averageDays) * 100)}% longer than average`
                    : "✅ Within normal industry timeframe"}
                </div>

                {benchmark.regulation && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>REGULATORY CONTEXT</span>
                    <div style={{ fontSize: '0.875rem', color: '#334155', marginTop: '0.25rem' }}>
                      {benchmark.regulation}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.125rem' }}>
                      {benchmark.description}
                    </div>
                    {isLegalOverdue && (
                      <div style={{
                        marginTop: '0.5rem',
                        padding: '0.5rem',
                        background: '#fff1f2',
                        borderLeft: '3px solid #e11d48',
                        fontSize: '0.875rem',
                        color: '#9f1239',
                        fontWeight: 500
                      }}>
                        🚨 Legal deadline likely exceeded. You have rapid escalation rights.
                      </div>
                    )}
                  </div>
                )}

                {(hold.status === 'overdue' || hold.status === 'escalated' || isBenchmarkOverdue) && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#ed8936', fontWeight: 600, textTransform: 'uppercase' }}>Recommended Next Steps</span>
                    <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#334155' }}>
                      {escalationSteps.map((step, i) => (
                        <li key={i} style={{ marginBottom: '0.25rem' }}>{step}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <FollowUpGenerator hold={hold} />
            </>
          )}
        </div>

        <div className="hold-detail__sidebar">
          {/* Sidebar reserved for future integrations */}
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
