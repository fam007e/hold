export type HoldCategory = 'finance' | 'healthcare' | 'government' | 'work' | 'education' | 'personal';
export type HoldStatus = 'pending' | 'overdue' | 'escalated' | 'resolved';

export const STATUS_INFO: Record<HoldStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: '#10b981' },
  overdue: { label: 'Overdue', color: '#ef4444' },
  escalated: { label: 'Escalated', color: '#f59e0b' },
  resolved: { label: 'Resolved', color: '#3b82f6' },
};
export type FollowUpTone = 'polite' | 'firm' | 'escalation';

export interface CategoryInfo {
  id: HoldCategory;
  label: string;
  icon: string;
  color: string;
  defaultResolutionDays: number;
}

export const CATEGORY_INFO: Record<HoldCategory, CategoryInfo> = {
  finance: { id: 'finance', label: 'Finance', icon: 'Banknote', color: '#10b981', defaultResolutionDays: 14 },
  healthcare: { id: 'healthcare', label: 'Healthcare', icon: 'HeartPulse', color: '#ef4444', defaultResolutionDays: 30 },
  government: { id: 'government', label: 'Government', icon: 'Landmark', color: '#3b82f6', defaultResolutionDays: 60 },
  work: { id: 'work', label: 'Work', icon: 'Briefcase', color: '#f59e0b', defaultResolutionDays: 7 },
  education: { id: 'education', label: 'Education', icon: 'GraduationCap', color: '#8b5cf6', defaultResolutionDays: 21 },
  personal: { id: 'personal', label: 'Personal', icon: 'User', color: '#6366f1', defaultResolutionDays: 14 },
};

export interface Attachment {
  id: string;
  name: string;
  originalName: string;
  type: string;
  size: number;
  uploadedAt: Date;
  storagePath: string;
  iv: string; // Encryption IV for the file body
}

export interface FollowUp {
  id: string;
  date: Date;
  message: string;
  tone: FollowUpTone;
}

export interface Resolution {
  date: Date;
  outcome: string;
  notes: string;
  timeWaitedDays?: number;
}

export interface IndustryBenchmark {
  category: HoldCategory;
  averageDays: number;
  legalDeadline?: number;
  regulation?: string;
  description: string;
}

export interface EscalationPath {
  label: string;
  description: string;
  link?: string;
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
  isRecurring?: boolean;
  recurrenceInterval?: 'monthly' | 'quarterly' | 'yearly';
  _isTampered?: boolean;
}

export interface NewHold {
  title: string;
  category: HoldCategory;
  counterparty: string;
  startDate: Date;
  expectedResolutionDays: number;
  status: HoldStatus;
  notes: string;
  attachments: Attachment[];
  isRecurring?: boolean;
  recurrenceInterval?: 'monthly' | 'quarterly' | 'yearly';
}
