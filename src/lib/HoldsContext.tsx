import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './AuthContext';
import type { Hold, NewHold, HoldStatus } from './types';

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

// Convert Firestore document to Hold type
function docToHold(id: string, data: any): Hold {
  return {
    id,
    userId: data.userId,
    title: data.title,
    category: data.category,
    counterparty: data.counterparty,
    startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : new Date(data.startDate),
    expectedResolutionDays: data.expectedResolutionDays,
    status: data.status,
    notes: data.notes || '',
    attachments: data.attachments || [],
    followUps: data.followUps || [],
    resolution: data.resolution ? {
      ...data.resolution,
      date: data.resolution.date instanceof Timestamp ? data.resolution.date.toDate() : new Date(data.resolution.date),
    } : undefined,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
  };
}

export function HoldsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [holds, setHolds] = useState<Hold[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to holds for current user
  useEffect(() => {
    if (!user) {
      setHolds([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, 'holds'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const holdsData = snapshot.docs.map(doc => docToHold(doc.id, doc.data()));
        setHolds(holdsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching holds:', err);
        setError('Failed to load holds');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const addHold = useCallback(async (newHold: NewHold): Promise<Hold> => {
    if (!user) throw new Error('Must be logged in');

    const holdData = {
      ...newHold,
      userId: user.uid,
      startDate: Timestamp.fromMillis(new Date(newHold.startDate).getTime()),
      attachments: [],
      followUps: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'holds'), holdData);

    return {
      ...newHold,
      id: docRef.id,
      userId: user.uid,
      attachments: [],
      followUps: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }, [user]);

  const updateHold = useCallback(async (id: string, updates: Partial<Hold>) => {
    const docRef = doc(db, 'holds', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }, []);

  const deleteHold = useCallback(async (id: string) => {
    const docRef = doc(db, 'holds', id);
    await deleteDoc(docRef);
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
