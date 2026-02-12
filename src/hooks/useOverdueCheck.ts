import { useEffect, useRef } from 'react';
import { useHolds } from '@/lib/HoldsContext';
import { useNotifications } from '@/lib/NotificationContext';
import { shouldBeOverdue } from '@/lib/utils';
import { differenceInDays } from 'date-fns';

export function useOverdueCheck() {
  const { holds, loading } = useHolds();
  const { addNotification } = useNotifications();

  // Track notified holds in a ref to avoid spamming within the same session
  // In a real production app, this might be persisted to localStorage with a timestamp
  const notifiedHoldsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (loading || holds.length === 0) return;

    // Check periodically? For now, we check whenever 'holds' updates.
    // Since 'holds' updates from Firestore snapshot, this effectively checks on load and strict updates.

    holds.forEach(hold => {
      // Logic: If it is overdue AND we haven't notified about it this session
      if (shouldBeOverdue(hold) && !notifiedHoldsRef.current.has(hold.id)) {

        // Calculate days overdue for the message
        const daysOverdue = differenceInDays(new Date(), new Date(hold.startDate)) - hold.expectedResolutionDays;

        addNotification({
          type: 'warning',
          title: 'Action Required: Overdue Hold',
          message: `"${hold.title}" is ${daysOverdue} days overdue. Consider sending a follow-up.`,
          duration: 8000
        });

        notifiedHoldsRef.current.add(hold.id);
      }
    });

  }, [holds, loading, addNotification]);
}
