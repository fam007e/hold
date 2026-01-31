import type { HoldStatus } from '@/lib/types';
import { STATUS_INFO } from '@/lib/types';
import './StatusBadge.css';

interface StatusBadgeProps {
  status: HoldStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const info = STATUS_INFO[status];

  return (
    <span
      className={`status-badge status-badge--${size}`}
      style={{
        '--status-color': info.color,
        '--status-bg': `${info.color}20`,
      } as React.CSSProperties}
    >
      <span className="status-badge__dot" />
      {info.label}
    </span>
  );
}
