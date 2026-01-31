export type HoldCategory =
  | 'finance'
  | 'healthcare'
  | 'government'
  | 'work'
  | 'education'
  | 'personal';

export type HoldStatus =
  | 'pending'
  | 'overdue'
  | 'escalated'
  | 'resolved';

export type FollowUpTone = 'polite' | 'firm' | 'escalation';

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedAt: Date;
}

export interface FollowUp {
  id: string;
  tone: FollowUpTone;
  message: string;
  sentAt?: Date;
  channel: 'email' | 'call' | 'portal';
}

export interface Resolution {
  date: Date;
  outcome: string;
  timeWaitedDays: number;
  notes?: string;
}

export interface Hold {
  id: string;
  userId: string;
  title: string;
  category: HoldCategory;
  counterparty: string;
  startDate: Date;
  expectedResolutionDays: number;
  status: HoldStatus;
  notes: string;
  attachments: Attachment[];
  followUps: FollowUp[];
  resolution?: Resolution;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
  createdAt: Date;
}

// Helper type for creating new holds
export type NewHold = Omit<Hold, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'attachments' | 'followUps' | 'resolution'>;

// Category metadata
export const CATEGORY_INFO: Record<HoldCategory, { label: string; icon: string; color: string }> = {
  finance: { label: 'Finance', icon: 'banknote', color: '#10b981' },
  healthcare: { label: 'Healthcare', icon: 'heart-pulse', color: '#ef4444' },
  government: { label: 'Government', icon: 'landmark', color: '#6366f1' },
  work: { label: 'Work / Freelance', icon: 'briefcase', color: '#f59e0b' },
  education: { label: 'Education', icon: 'graduation-cap', color: '#8b5cf6' },
  personal: { label: 'Personal', icon: 'user', color: '#06b6d4' },
};

// Status metadata
export const STATUS_INFO: Record<HoldStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: '#f59e0b' },
  overdue: { label: 'Overdue', color: '#ef4444' },
  escalated: { label: 'Escalated', color: '#dc2626' },
  resolved: { label: 'Resolved', color: '#10b981' },
};
