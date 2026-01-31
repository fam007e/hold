import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Hold, NewHold, HoldStatus } from './types';
import { shouldBeOverdue } from './utils';

// Demo data for development
const DEMO_HOLDS: Hold[] = [
  {
    id: '1',
    userId: 'demo',
    title: 'Insurance Refund – Claim #4832',
    category: 'finance',
    counterparty: 'BlueCross Insurance',
    startDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    expectedResolutionDays: 14,
    status: 'pending',
    notes: 'Submitted claim for dental procedure. Expected $450 refund.',
    attachments: [],
    followUps: [],
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    userId: 'demo',
    title: 'Passport Renewal Application',
    category: 'government',
    counterparty: 'US Department of State',
    startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    expectedResolutionDays: 42,
    status: 'overdue',
    notes: 'Expedited processing requested. Reference: APP-2024-88432',
    attachments: [],
    followUps: [],
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    userId: 'demo',
    title: 'Freelance Invoice #1089',
    category: 'work',
    counterparty: 'Acme Corp',
    startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    expectedResolutionDays: 30,
    status: 'pending',
    notes: 'Net 30 payment terms. Invoice for December work.',
    attachments: [],
    followUps: [],
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
  },
  {
    id: '4',
    userId: 'demo',
    title: 'Medical Records Request',
    category: 'healthcare',
    counterparty: 'City Hospital',
    startDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    expectedResolutionDays: 10,
    status: 'pending',
    notes: 'Requested complete medical history for new doctor.',
    attachments: [],
    followUps: [],
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
  },
];

interface HoldsContextType {
  holds: Hold[];
  loading: boolean;
  error: string | null;
  addHold: (hold: NewHold) => Promise<Hold>;
  updateHold: (id: string, updates: Partial<Hold>) => Promise<void>;
  deleteHold: (id: string) => Promise<void>;
  updateStatus: (id: string, status: HoldStatus) => Promise<void>;
  resolveHold: (id: string, outcome: string, notes?: string) => Promise<void>;
  getHold: (id: string) => Hold | undefined;
}

const HoldsContext = createContext<HoldsContextType | undefined>(undefined);

export function HoldsProvider({ children }: { children: React.ReactNode }) {
  const [holds, setHolds] = useState<Hold[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load demo data on mount
  useEffect(() => {
    // Simulate loading and check for overdue items
    const timer = setTimeout(() => {
      const updatedHolds = DEMO_HOLDS.map(hold => {
        if (shouldBeOverdue(hold) && hold.status === 'pending') {
          return { ...hold, status: 'overdue' as const };
        }
        return hold;
      });
      setHolds(updatedHolds);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const addHold = useCallback(async (newHold: NewHold): Promise<Hold> => {
    const hold: Hold = {
      ...newHold,
      id: crypto.randomUUID(),
      userId: 'demo',
      attachments: [],
      followUps: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setHolds(prev => [hold, ...prev]);
    return hold;
  }, []);

  const updateHold = useCallback(async (id: string, updates: Partial<Hold>) => {
    setHolds(prev =>
      prev.map(hold =>
        hold.id === id
          ? { ...hold, ...updates, updatedAt: new Date() }
          : hold
      )
    );
  }, []);

  const deleteHold = useCallback(async (id: string) => {
    setHolds(prev => prev.filter(hold => hold.id !== id));
  }, []);

  const updateStatus = useCallback(async (id: string, status: HoldStatus) => {
    await updateHold(id, { status });
  }, [updateHold]);

  const resolveHold = useCallback(async (id: string, outcome: string, notes?: string) => {
    const hold = holds.find(h => h.id === id);
    if (!hold) return;

    const timeWaitedDays = Math.ceil(
      (Date.now() - new Date(hold.startDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    await updateHold(id, {
      status: 'resolved',
      resolution: {
        date: new Date(),
        outcome,
        timeWaitedDays,
        notes,
      },
    });
  }, [holds, updateHold]);

  const getHold = useCallback((id: string) => {
    return holds.find(h => h.id === id);
  }, [holds]);

  return (
    <HoldsContext.Provider
      value={{
        holds,
        loading,
        error,
        addHold,
        updateHold,
        deleteHold,
        updateStatus,
        resolveHold,
        getHold,
      }}
    >
      {children}
    </HoldsContext.Provider>
  );
}

export function useHolds() {
  const context = useContext(HoldsContext);
  if (!context) {
    throw new Error('useHolds must be used within a HoldsProvider');
  }
  return context;
}
