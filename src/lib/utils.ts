import { differenceInDays, addDays, format, isAfter, isBefore, startOfDay } from 'date-fns';
import type { Hold, HoldStatus, FollowUpTone } from './types';

/**
 * Calculate the urgency level of a hold (0-100)
 * 0 = just started, 100 = critically overdue
 */
export function calculateUrgency(hold: Hold): number {
  if (hold.status === 'resolved') return 0;

  const today = startOfDay(new Date());
  const start = startOfDay(new Date(hold.startDate));
  const expectedEnd = addDays(start, hold.expectedResolutionDays);

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

/**
 * Generate follow-up message based on tone
 */
export function generateFollowUpMessage(hold: Hold, tone: FollowUpTone): string {
  const daysWaiting = differenceInDays(new Date(), new Date(hold.startDate));

  const templates: Record<FollowUpTone, string> = {
    polite: `Dear ${hold.counterparty} Team,

I hope this message finds you well. I'm writing to follow up on my request regarding "${hold.title}".

It has been ${daysWaiting} days since I initially submitted this request on ${formatDate(hold.startDate)}. I understand that these matters can take time, and I wanted to check on the current status.

Could you please provide an update on when I might expect a resolution?

Thank you for your time and assistance.

Best regards`,

    firm: `To Whom It May Concern at ${hold.counterparty},

I am writing to request an update on "${hold.title}" which was submitted ${daysWaiting} days ago on ${formatDate(hold.startDate)}.

The expected resolution timeframe of ${hold.expectedResolutionDays} days has ${getDaysRemaining(hold) < 0 ? 'passed' : 'not yet passed'}. I would appreciate a prompt response with a clear timeline for resolution.

Please provide an update within 48 hours.

Regards`,

    escalation: `URGENT: Escalation Request

To: ${hold.counterparty} Management

Subject: Escalation - "${hold.title}"

This matter was first raised ${daysWaiting} days ago on ${formatDate(hold.startDate)} and remains unresolved despite the expected resolution window of ${hold.expectedResolutionDays} days.

I am formally escalating this issue and request:
1. Immediate acknowledgment of this escalation
2. Assignment to a senior team member
3. A concrete resolution timeline within 24 hours

If I do not receive a satisfactory response, I will be forced to explore additional avenues including regulatory bodies and consumer protection agencies.

This is my final attempt to resolve this matter directly.

Regards`,
  };

  return templates[tone];
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
