import { differenceInDays, addDays, format, isAfter, startOfDay } from 'date-fns';
import type { Hold, HoldStatus, FollowUpTone, IndustryBenchmark } from './types';

// --- Static Data for Leverage Engine (Zero Knowledge) ---
// stored locally to avoid server queries

const BENCHMARKS: Record<string, IndustryBenchmark> = {
  finance: {
    category: 'finance',
    averageDays: 14,
    legalDeadline: 60, // FCBA
    regulation: 'Fair Credit Billing Act (FCBA)',
    description: 'Most disputed charges must be acknowledged within 30 days and resolved within two billing cycles (max 90 days).'
  },
  healthcare: {
    category: 'healthcare',
    averageDays: 30,
    legalDeadline: 60, // HIPAA / ACA appeal limits often 30-60
    regulation: 'HIPAA & ACA Appeal Rights',
    description: 'Insurers generally have 30 days (pre-service) or 60 days (post-service) to decide on a claim appeal.'
  },
  government: {
    category: 'government',
    averageDays: 45,
    regulation: 'Freedom of Information Act (FOIA) / Agency Guidelines',
    description: 'Federal agencies have 20 working days to respond to FOIA requests, though complex requests take longer.'
  },
  work: {
    category: 'work',
    averageDays: 7,
    description: 'Internal corporate requests (HR/IT) typically have SLAs of 24-48 hours for high priority, up to 1 week for standard.'
  },
  education: {
    category: 'education',
    averageDays: 14,
    regulation: 'FERPA',
    description: 'Schools must provide access to education records within 45 days of a request.'
  },
  personal: {
    category: 'personal',
    averageDays: 7,
    description: 'General personal matters typically resolve within a week.'
  }
};

const ESCALATION_PATHS: Record<string, string[]> = {
  finance: [
    'File a complaint with the Consumer Financial Protection Bureau (CFPB)',
    'Contact your State Attorney General',
    'Submit a dispute with the credit reporting agencies'
  ],
  healthcare: [
    'File an appeal with the insurance company',
    'Contact your State Insurance Commissioner',
    'File a complaint with HHS (for HIPAA violations)'
  ],
  government: [
    'Contact the Agency\'s FOIA Public Liaison',
    'Reach out to your Congressional Representative for casework help',
    'File an appeal with the agency head'
  ],
  work: [
    'Escalate to the Department Manager',
    'Contact HR (People Ops) or Ethics Hotline',
    'Consult local labor board (if statutory violation)'
  ],
  education: [
    'Contact the Department Chair or Dean',
    'File a formal grievance with the Student Affairs office',
    'Contact the U.S. Department of Education (Family Policy Compliance Office)'
  ],
  personal: [
    'Request to speak with a supervisor',
    'Post a public review (Social Media/BBB)',
    'Consider small claims court'
  ]
};

export function getBenchmark(category: string): IndustryBenchmark {
  return BENCHMARKS[category] || BENCHMARKS.personal;
}

export function getEscalationSteps(category: string): string[] {
  return ESCALATION_PATHS[category] || ESCALATION_PATHS.personal;
}
// --- End Static Data ---

/**
 * Calculate the urgency level of a hold (0-100)
 * 0 = just started, 100 = critically overdue
 */
export function calculateUrgency(hold: Hold): number {
  if (hold.status === 'resolved') return 0;

  const today = startOfDay(new Date());
  const start = startOfDay(new Date(hold.startDate));

  const daysElapsed = differenceInDays(today, start);
  const totalDays = hold.expectedResolutionDays;

  if (daysElapsed <= 0) return 0;
  if (daysElapsed >= totalDays) {
    // Overdue - scale from 100 to 150 based on how overdue
    const overdueDays = daysElapsed - totalDays;
    return Math.min(150, 100 + overdueDays * 5);
  }

  return Math.round((daysElapsed / totalDays) * 100);
}

export type RiskLevel = 'Low' | 'Medium' | 'High';

export function calculateRiskScore(hold: Hold): number {
  if (hold.status === 'resolved') return 0;

  const now = new Date();
  const start = new Date(hold.startDate);
  const elapsedDays = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  // Base score based on progress towards expected date
  const progressPercent = (elapsedDays / hold.expectedResolutionDays) * 100;

  // If already overdue, max risk
  if (progressPercent >= 100) return 100;

  let score = progressPercent;

  // Acceleration curve - risk increases faster as we get closer to deadline
  if (progressPercent > 80) {
    score += 10; // Jumping into High risk territory
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'High';
  if (score >= 50) return 'Medium';
  return 'Low';
}

/**
 * Get the urgency color based on the level
 */
export function getUrgencyColor(urgency: number): string {
  if (urgency <= 30) return '#10b981'; // Green
  if (urgency <= 60) return '#f59e0b'; // Yellow
  if (urgency <= 100) return '#f97316'; // Orange
  return '#ef4444'; // Red
}

/**
 * Determine if a hold should be marked as overdue
 */
export function shouldBeOverdue(hold: Hold): boolean {
  if (hold.status === 'resolved' || hold.status === 'escalated') return false;

  const today = startOfDay(new Date());
  const start = startOfDay(new Date(hold.startDate));
  const expectedEnd = addDays(start, hold.expectedResolutionDays);

  return isAfter(today, expectedEnd);
}

/**
 * Calculate days until expected resolution
 */
export function getDaysRemaining(hold: Hold): number {
  const today = startOfDay(new Date());
  const start = startOfDay(new Date(hold.startDate));
  const expectedEnd = addDays(start, hold.expectedResolutionDays);

  return differenceInDays(expectedEnd, today);
}

/**
 * Format a date for display
 */
export function formatDate(date: Date | string): string {
  return format(new Date(date), 'MMM d, yyyy');
}

/**
 * Format relative days
 */
export function formatDaysRelative(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days > 0) return `In ${days} days`;
  return `${Math.abs(days)} days ago`;
}

interface FollowUpContent {
  subject: string;
  body: string;
}

/**
 * Generate structured follow-up content based on tone and category
 */
export function generateFollowUpContent(hold: Hold, tone: FollowUpTone): FollowUpContent {
  const daysWaiting = differenceInDays(new Date(), new Date(hold.startDate));
  const dateStr = formatDate(hold.startDate);

  // Category-specific context
  const contextMap: Record<string, string> = {
    finance: `regarding the financial transaction for "${hold.title}"`,
    healthcare: `regarding the medical record/claim "${hold.title}"`,
    government: `regarding the application/request "${hold.title}"`,
    work: `regarding the work item "${hold.title}"`,
    education: `regarding the academic record/request "${hold.title}"`,
    personal: `regarding "${hold.title}"`
  };

  const context = contextMap[hold.category] || contextMap.personal;

  // Subject Lines
  const subjects: Record<FollowUpTone, string> = {
    polite: `Follow-up: ${hold.title}`,
    firm: `Action Required: ${hold.title} - ${daysWaiting} Days Overdue`,
    escalation: `URGENT ESCALATION: ${hold.title} - Immediate Attention Required`
  };

  // Body Templates
  const templates: Record<FollowUpTone, string> = {
    polite: `Dear ${hold.counterparty} Team,

I hope this message finds you well. I'm writing to follow up ${context}.

It has been ${daysWaiting} days since I initially submitted this request on ${dateStr}. I understand that these matters can take time, and I wanted to check on the current status.

Could you please provide an update on when I might expect a resolution?

Thank you for your time and assistance.

Best regards,`,

    firm: `To Whom It May Concern at ${hold.counterparty},

I am writing to formally request an update on ${context}, which was submitted ${daysWaiting} days ago on ${dateStr}.

The expected resolution timeframe of ${hold.expectedResolutionDays} days has ${getDaysRemaining(hold) < 0 ? 'passed' : 'not yet passed'}. I would appreciate a prompt response with a clear timeline for resolution.

Please provide an update within 48 hours.

Regards,`,

    escalation: `URGENT: Escalation Request
To: ${hold.counterparty} Management
Reference: ${hold.title}

This matter was first raised ${daysWaiting} days ago on ${dateStr} and remains unresolved.

I am formally escalating this issue and request:
1. Immediate acknowledgment of this escalation
2. Assignment to a senior team member
3. A concrete resolution timeline within 24 hours

If I do not receive a satisfactory response, I will be forced to explore additional avenues including regulatory bodies and consumer protection agencies.

This is my final attempt to resolve this matter directly.

Regards,`
  };

  return {
    subject: subjects[tone],
    body: templates[tone]
  };
}

/**
 * Generate follow-up message string (Legacy warpper)
 */
export function generateFollowUpMessage(hold: Hold, tone: FollowUpTone): string {
  const content = generateFollowUpContent(hold, tone);
  return `Subject: ${content.subject}\n\n${content.body}`;
}

/**
 * Get suggested next status based on hold state
 */
export function getSuggestedStatus(hold: Hold): HoldStatus {
  if (hold.status === 'resolved') return 'resolved';
  if (shouldBeOverdue(hold) && hold.status === 'pending') return 'overdue';
  if (hold.followUps.length >= 3 && hold.status === 'overdue') return 'escalated';
  return hold.status;
}
