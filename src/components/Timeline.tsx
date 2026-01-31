import type { Hold } from '@/lib/types';
import { calculateUrgency, getUrgencyColor, getDaysRemaining, formatDate } from '@/lib/utils';
import './Timeline.css';

interface TimelineProps {
  hold: Hold;
  compact?: boolean;
}

export function Timeline({ hold, compact = false }: TimelineProps) {
  const urgency = calculateUrgency(hold);
  const urgencyColor = getUrgencyColor(urgency);
  const daysRemaining = getDaysRemaining(hold);
  const isResolved = hold.status === 'resolved';

  const startDate = new Date(hold.startDate);
  const expectedDate = new Date(startDate);
  expectedDate.setDate(expectedDate.getDate() + hold.expectedResolutionDays);

  // Calculate progress percentage (capped at 100 for visual)
  const visualProgress = Math.min(urgency, 100);

  if (compact) {
    return (
      <div className="timeline timeline--compact">
        <div className="timeline__bar">
          <div
            className="timeline__progress"
            style={{
              width: `${visualProgress}%`,
              background: isResolved ? '#10b981' : urgencyColor,
            }}
          />
        </div>
        <span className="timeline__label" style={{ color: isResolved ? '#10b981' : urgencyColor }}>
          {isResolved
            ? 'Resolved'
            : daysRemaining >= 0
              ? `${daysRemaining}d left`
              : `${Math.abs(daysRemaining)}d overdue`
          }
        </span>
      </div>
    );
  }

  return (
    <div className="timeline">
      <div className="timeline__header">
        <span className="timeline__days-label">
          {isResolved
            ? `Resolved in ${hold.resolution?.timeWaitedDays} days`
            : daysRemaining >= 0
              ? `${daysRemaining} days remaining`
              : `${Math.abs(daysRemaining)} days overdue`
          }
        </span>
      </div>

      <div className="timeline__track">
        <div className="timeline__bar timeline__bar--full">
          <div
            className="timeline__progress"
            style={{
              width: `${visualProgress}%`,
              background: isResolved
                ? 'linear-gradient(90deg, #10b981, #059669)'
                : `linear-gradient(90deg, #10b981, ${urgencyColor})`,
            }}
          />

          {/* Milestone markers */}
          <div className="timeline__milestone timeline__milestone--start">
            <div className="timeline__milestone-dot" />
            <span className="timeline__milestone-label">Start</span>
            <span className="timeline__milestone-date">{formatDate(startDate)}</span>
          </div>

          <div
            className="timeline__milestone timeline__milestone--end"
            style={{ '--milestone-color': urgencyColor } as React.CSSProperties}
          >
            <div className="timeline__milestone-dot" />
            <span className="timeline__milestone-label">Expected</span>
            <span className="timeline__milestone-date">{formatDate(expectedDate)}</span>
          </div>

          {isResolved && hold.resolution && (
            <div
              className="timeline__milestone timeline__milestone--resolved"
              style={{ left: `${Math.min(visualProgress, 100)}%` }}
            >
              <div className="timeline__milestone-dot timeline__milestone-dot--resolved" />
              <span className="timeline__milestone-label">Resolved</span>
              <span className="timeline__milestone-date">{formatDate(hold.resolution.date)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
