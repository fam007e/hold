import { Link } from 'react-router-dom';
import {
  Banknote,
  HeartPulse,
  Landmark,
  Briefcase,
  GraduationCap,
  User,
  ChevronRight,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import type { Hold, HoldCategory } from '@/lib/types';
import { CATEGORY_INFO } from '@/lib/types';
import { calculateRiskScore, getRiskLevel } from '@/lib/utils';
import { StatusBadge } from './StatusBadge';
import { Timeline } from './Timeline';
import './HoldCard.css';

const CATEGORY_ICONS: Record<HoldCategory, React.ReactNode> = {
  finance: <Banknote size={18} />,
  healthcare: <HeartPulse size={18} />,
  government: <Landmark size={18} />,
  work: <Briefcase size={18} />,
  education: <GraduationCap size={18} />,
  personal: <User size={18} />,
};

interface HoldCardProps {
  hold: Hold;
}

export function HoldCard({ hold }: HoldCardProps) {
  const categoryInfo = CATEGORY_INFO[hold.category];
  const riskScore = calculateRiskScore(hold);
  const riskLevel = getRiskLevel(riskScore);
  const showRisk = riskLevel === 'High' && hold.status === 'pending';
  const isTampered = hold._isTampered;

  return (
    <Link to={`/hold/${hold.id}`} className={`hold-card ${isTampered ? 'hold-card--tampered' : ''}`}>
      <div className="hold-card__header">
        <div
          className="hold-card__icon"
          style={{ background: `${categoryInfo.color}20`, color: categoryInfo.color }}
        >
          {CATEGORY_ICONS[hold.category]}
        </div>
        <div className="hold-card__meta">
          <span className="hold-card__category">{categoryInfo.label}</span>

          {isTampered && (
            <div className="hold-card__tampered" title="Security Alert: Data integrity verification failed">
              <ShieldAlert size={14} color="#ef4444" />
              <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.75rem' }}>TAMPERED</span>
            </div>
          )}

          {showRisk && !isTampered && (
            <div className="hold-card__risk" title={`High Risk Score: ${riskScore}`}>
              <AlertTriangle size={14} />
              <span>Risk</span>
            </div>
          )}
          <StatusBadge status={hold.status} size="sm" />
        </div>
        <ChevronRight className="hold-card__arrow" size={20} />
      </div>

      <h3 className="hold-card__title">{hold.title}</h3>
      <p className="hold-card__counterparty">{hold.counterparty}</p>

      <div className="hold-card__timeline">
        <Timeline hold={hold} compact />
      </div>
    </Link>
  );
}
