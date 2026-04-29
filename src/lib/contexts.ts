import { createContext } from 'react';
import { User } from 'firebase/auth';
import type { Hold, NewHold, HoldStatus, Notification } from './types';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  encryptionKey: CryptoKey | null;
  signingKey: CryptoKey | null;
  isLocked: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  unlock: (password: string) => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface HoldsContextType {
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

export const HoldsContext = createContext<HoldsContextType | undefined>(undefined);

export interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
