import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
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
import { encryptValue, decryptValue, signRecord, verifyRecord, type EncryptedData } from './security';

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
  contributeToBenchmark: (hold: Hold) => Promise<void>;
}

const HoldsContext = createContext<HoldsContextType | undefined>(undefined);

// Helper to check if data is in encrypted format
function isEncryptedData(data: any): data is EncryptedData {
  return data && typeof data.ciphertext === 'string' && typeof data.iv === 'string';
}

// Helper to ensure consistent object structure for signing and verification
function getHoldSigningData(data: any) {
  return {
    userId: data.userId,
    category: data.category,
    startDate: data.startDate,
    expectedResolutionDays: data.expectedResolutionDays,
    status: data.status,
    attachments: data.attachments || [],
    followUps: data.followUps || [],
    resolution: data.resolution || null,
    title: data.title,
    counterparty: data.counterparty,
    notes: data.notes || null,
    createdAt: data.createdAt,
    isRecurring: data.isRecurring || false,
    recurrenceInterval: data.recurrenceInterval || null,
  };
}

export function HoldsProvider({ children }: { children: React.ReactNode }) {
  const { user, encryptionKey, signingKey, isLocked } = useAuth();
  const [holds, setHolds] = useState<Hold[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert Firestore document to Hold type (Async for decryption and verification)
  const docToHold = useCallback(async (id: string, data: any): Promise<Hold & { _isTampered?: boolean }> => {
    // 1. Verify signature FIRST before processing anything
    let isTampered = false;
    if (signingKey && data._signature) {
      // Reconstruct the signed data exactly as it was created in add/update
      const dataToVerify = getHoldSigningData(data);

      try {
        const isValid = await verifyRecord(dataToVerify, data._signature, signingKey);
        if (!isValid) {
          console.error(`Security Alert: Signature verification failed for hold ${id}`);
          isTampered = true;
        }
      } catch (err) {
        console.error(`Security Error: Verification process failed for hold ${id}`, err);
        isTampered = true;
      }
    }

    // 2. Decrypt fields if key is available and data is encrypted
    let title = data.title;
    let counterparty = data.counterparty;
    let notes = data.notes || '';
    let resolution = data.resolution;
    let followUps = data.followUps || [];

    // Default values for metadata if encrypted and locked/tampered
    let category = data.category;
    let status = data.status;
    let startDate = data.startDate instanceof Timestamp ? data.startDate.toDate() : (data.startDate ? new Date(data.startDate) : new Date());
    let expectedResolutionDays = data.expectedResolutionDays;
    let createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date());
    const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : new Date());

    if (encryptionKey && !isTampered) {
      try {
        if (isEncryptedData(data.title)) title = await decryptValue(data.title, encryptionKey);
        if (isEncryptedData(data.counterparty)) counterparty = await decryptValue(data.counterparty, encryptionKey);
        if (isEncryptedData(data.notes)) notes = await decryptValue(data.notes, encryptionKey);

        // Decrypt Metadata
        // Graceful fallback: if data is not encrypted (legacy), use as is.
        if (isEncryptedData(data.category)) category = await decryptValue(data.category, encryptionKey);
        if (isEncryptedData(data.status)) status = await decryptValue(data.status, encryptionKey);

        if (isEncryptedData(data.startDate)) {
          const dateStr = await decryptValue(data.startDate, encryptionKey);
          startDate = new Date(dateStr);
        }
        if (isEncryptedData(data.expectedResolutionDays)) {
          const daysStr = await decryptValue(data.expectedResolutionDays, encryptionKey);
          expectedResolutionDays = parseInt(daysStr, 10);
        }
        if (isEncryptedData(data.createdAt)) {
          const dateStr = await decryptValue(data.createdAt, encryptionKey);
          createdAt = new Date(dateStr);
        }
        // We can leave updatedAt as server timestamp or encrypt it too.
        // For consistency with "Zero Knowledge", let's assume we might encrypt it or just rely on server timestamp for sync.
        // In the updateHold function we are now encrypting it? No, usually usually we leave updatedAt for sync.
        // But strict Zero Knowledge might want to hide usage patterns.
        // Let's stick to business logic fields for now.
      } catch (e) {
        console.error('Decryption error for hold ' + id, e);
      }

      // Decrypt resolution notes
      if (data.resolution && isEncryptedData(data.resolution.notes)) {
        try {
          const decryptedNotes = await decryptValue(data.resolution.notes, encryptionKey);
          resolution = { ...data.resolution, notes: decryptedNotes };
        } catch (e) {
          console.error('Failed to decrypt resolution notes', e);
          resolution = { ...data.resolution, notes: '⚠️ Decryption Failed' };
        }
      }

      // Decrypt follow-ups
      if (data.followUps && Array.isArray(data.followUps)) {
        followUps = await Promise.all(data.followUps.map(async (f: any) => {
          let message = f.message;
          if (isEncryptedData(f.message)) {
            try {
              message = await decryptValue(f.message, encryptionKey);
            } catch (e) {
              console.error('Failed to decrypt follow-up', e);
              message = '⚠️ Decryption Failed';
            }
          }
          return { ...f, message };
        }));
      }

      // Decrypt attachments metadata
      if (data.attachments && Array.isArray(data.attachments)) {
        const decryptedAttachments = await Promise.all(data.attachments.map(async (att: any) => {
          let name = att.name;
          let originalName = att.originalName;
          let type = att.type;

          try {
            if (isEncryptedData(att.name)) name = await decryptValue(att.name, encryptionKey);
            if (isEncryptedData(att.originalName)) originalName = await decryptValue(att.originalName, encryptionKey);
            if (isEncryptedData(att.type)) type = await decryptValue(att.type, encryptionKey);
          } catch (e) {
            console.error('Failed to decrypt attachment metadata', e);
            name = '⚠️ Decryption Failed';
          }

          return {
            ...att,
            name,
            originalName,
            type
          };
        }));
        data.attachments = decryptedAttachments;
      }
    } else if (!encryptionKey || isTampered) {
      // Locked or Tampered view
      if (isEncryptedData(data.title)) {
        const msg = isTampered ? '⚠️ Tampered' : '🔒 Encrypted';
        title = msg;
        counterparty = msg;
        notes = msg;
        if (isEncryptedData(data.category)) category = 'personal'; // Default dummy
        if (isEncryptedData(data.status)) status = 'pending'; // Default dummy
        if (isEncryptedData(data.expectedResolutionDays)) expectedResolutionDays = 0; // Default dummy
        // Keep dates as is (likely invalid/current date) or handle gracefully
      }
    }

    return {
      id,
      userId: data.userId,
      title,
      category,
      counterparty,
      startDate,
      expectedResolutionDays,
      status,
      notes,
      attachments: data.attachments || [],
      followUps,
      resolution: resolution ? {
        ...resolution,
        date: resolution.date instanceof Timestamp ? resolution.date.toDate() : new Date(resolution.date),
      } : undefined,
      createdAt,
      updatedAt,
      isRecurring: data.isRecurring,
      recurrenceInterval: data.recurrenceInterval,
      _isTampered: isTampered,
    };
  }, [encryptionKey, signingKey]);

  // Subscribe to holds for current user
  useEffect(() => {
    if (!user) {
      Promise.resolve().then(() => {
        setHolds([]);
        setLoading(false);
      });
      return;
    }

    if (isLocked) {
      // If locked, we might choose not to fetch, or fetch but display locks.
      // Let's fetch so the user sees *something* exists.
    }

    Promise.resolve().then(() => {
      setLoading(true);
    });

    const q = query(
      collection(db, 'holds'),
      where('userId', '==', user.uid)
      // orderBy('createdAt', 'desc') // Removed for client-side sorting (encrypted metadata)
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const holdsPromises = snapshot.docs.map(doc => docToHold(doc.id, doc.data()));
          const holdsData = await Promise.all(holdsPromises);

          // Client-side sort
          holdsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

          setHolds(holdsData);
          setLoading(false);
          setError(null);
        } catch (err) {
          console.error("Error processing holds:", err);
          setError("Failed to decrypt holds");
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error fetching holds:', err);
        setError('Failed to load holds');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user, docToHold, isLocked]);

  const addHold = useCallback(async (newHold: NewHold): Promise<Hold> => {
    if (!user) throw new Error('Must be logged in');
    if (isLocked || !encryptionKey || !signingKey) throw new Error('Vault is locked. Cannot save encrypted data.');

    // Encrypt sensitive fields
    const encryptedTitle = await encryptValue(newHold.title, encryptionKey);
    const encryptedCounterparty = await encryptValue(newHold.counterparty, encryptionKey);
    const encryptedNotes = newHold.notes ? await encryptValue(newHold.notes, encryptionKey) : null;

    // Encrypt metadata
    const encryptedCategory = await encryptValue(newHold.category, encryptionKey);
    const encryptedStatus = await encryptValue('pending', encryptionKey);
    const encryptedStartDate = await encryptValue(new Date(newHold.startDate).toISOString(), encryptionKey);
    const encryptedExpectedDays = await encryptValue(String(newHold.expectedResolutionDays), encryptionKey);
    const encryptedCreatedAt = await encryptValue(new Date().toISOString(), encryptionKey);

    // Encrypt attachment metadata
    const encryptedAttachments = await Promise.all((newHold.attachments || []).map(async (att) => {
      return {
        ...att,
        name: await encryptValue(att.name, encryptionKey),
        originalName: await encryptValue(att.originalName, encryptionKey),
        type: await encryptValue(att.type, encryptionKey),
      };
    }));

    // Data to be signed (includes encrypted values)
    const dataToSign = getHoldSigningData({
      userId: user.uid,
      category: encryptedCategory,
      startDate: encryptedStartDate,
      expectedResolutionDays: encryptedExpectedDays,
      status: encryptedStatus,
      attachments: encryptedAttachments,
      followUps: [],
      resolution: null,
      title: encryptedTitle,
      counterparty: encryptedCounterparty,
      notes: encryptedNotes,
      createdAt: encryptedCreatedAt,
      isRecurring: newHold.isRecurring || false,
      recurrenceInterval: newHold.recurrenceInterval || null,
    });

    const signature = await signRecord(dataToSign, signingKey);

    const holdData = {
      ...dataToSign,
      // createdAt: serverTimestamp(), // We store encrypted createdAt in dataToSign/baseData? No, dataToSign has it.
      // Firestore needs a physical field for indexing? No, we index by userId only.
      // But we probably want a server timestamp for sync backup.
      updatedAt: serverTimestamp(),
      _signature: signature,
      _encryptionVersion: 'v2-zk',
    };

    const docRef = await addDoc(collection(db, 'holds'), holdData);

    return {
      ...newHold,
      id: docRef.id,
      userId: user.uid,
      status: 'pending' as HoldStatus,
      attachments: [],
      followUps: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }, [user, encryptionKey, signingKey, isLocked]);

  const updateHold = useCallback(async (id: string, updates: Partial<Hold>) => {
    if (!user || !encryptionKey || !signingKey) throw new Error('Vault locked');

    // To maintain security entropy and integrity, we must re-sign the WHOLE record.
    // This requires a Read-Modify-Write cycle.
    const hold = holds.find(h => h.id === id);
    if (!hold) throw new Error('Hold not found localy');

    // 1. Prepare merged state (using decrypted local values)
    const merged = {
      ...hold,
      ...updates,
    };

    // 2. Encrypt sensitive fields
    const encryptedTitle = await encryptValue(merged.title, encryptionKey);
    const encryptedCounterparty = await encryptValue(merged.counterparty, encryptionKey);
    const encryptedNotes = merged.notes ? await encryptValue(merged.notes, encryptionKey) : null;

    // Encrypt metadata
    const encryptedCategory = await encryptValue(merged.category, encryptionKey);
    const encryptedStatus = await encryptValue(merged.status, encryptionKey);
    const encryptedStartDate = await encryptValue(new Date(merged.startDate).toISOString(), encryptionKey);
    const encryptedExpectedDays = await encryptValue(String(merged.expectedResolutionDays), encryptionKey);
    const encryptedCreatedAt = await encryptValue(new Date(merged.createdAt).toISOString(), encryptionKey);

    // Encrypt attachment metadata
    const encryptedAttachments = await Promise.all((merged.attachments || []).map(async (att) => {
      return {
        ...att,
        name: await encryptValue(att.name, encryptionKey),
        originalName: await encryptValue(att.originalName, encryptionKey),
        type: await encryptValue(att.type, encryptionKey),
      };
    }));

    // Encrypt resolution notes if present
    let encryptedResolution = null;
    if (merged.resolution) {
      encryptedResolution = {
        ...merged.resolution,
        date: Timestamp.fromMillis(new Date(merged.resolution.date).getTime()),
        notes: merged.resolution.notes ? await encryptValue(merged.resolution.notes, encryptionKey) : null,
      };
    }

    // Encrypt follow-ups
    const encryptedFollowUps = await Promise.all((merged.followUps || []).map(async (f) => {
      return {
        ...f,
        message: await encryptValue(f.message, encryptionKey),
      };
    }));

    // 3. Reconstruct signed object structure
    const dataToSign = getHoldSigningData({
      userId: user.uid,
      category: encryptedCategory,
      startDate: encryptedStartDate,
      expectedResolutionDays: encryptedExpectedDays,
      status: encryptedStatus,
      attachments: encryptedAttachments,
      followUps: encryptedFollowUps,
      resolution: encryptedResolution,
      title: encryptedTitle,
      counterparty: encryptedCounterparty,
      notes: encryptedNotes,
      createdAt: encryptedCreatedAt,
      isRecurring: merged.isRecurring || false,
      recurrenceInterval: merged.recurrenceInterval || null,
    });

    const signature = await signRecord(dataToSign, signingKey);

    const dbUpdates = {
      ...dataToSign,
      updatedAt: serverTimestamp(),
      _signature: signature,
    };

    const docRef = doc(db, 'holds', id);
    await updateDoc(docRef, dbUpdates);
  }, [user, encryptionKey, signingKey, holds]);

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

    // Encrypt resolution notes if present
    // Note: resolution object structure might need updates too
    // For now, simplicity.

    await updateHold(id, {
      status: 'resolved',
      resolution: {
        date: new Date(),
        outcome,
        timeWaitedDays,
        notes: notes ?? '',
      },
    });
  }, [holds, updateHold]);

  const getHold = useCallback((id: string) => {
    return holds.find(h => h.id === id);
  }, [holds]);

  const contributeToBenchmark = useCallback(async (hold: Hold) => {
    if (!hold.resolution) return;
    const daysWaited = Math.ceil((hold.resolution.date.getTime() - hold.startDate.getTime()) / (1000 * 60 * 60 * 24));
    await addDoc(collection(db, 'public_benchmarks'), {
      category: hold.category,
      daysWaited,
      contributedAt: serverTimestamp(),
    });
  }, []);

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
        contributeToBenchmark,
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
