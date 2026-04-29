import { useContext } from 'react';
import { HoldsContext } from '@/lib/contexts';

export function useHolds() {
  const context = useContext(HoldsContext);
  if (!context) {
    throw new Error('useHolds must be used within a HoldsProvider');
  }
  return context;
}
