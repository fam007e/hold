import React, { useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { AuthContext } from './contexts';
import { deriveKey, deriveSigningKey } from './security';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [signingKey, setSigningKey] = useState<CryptoKey | null>(null);

  // If user is present but keys are missing, the vault is locked
  const isLocked = !!user && !encryptionKey;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      // If user logs out or session changes, keys are processed here
      // But since keys are memory-only, they persist until reload or explicit clear
      if (!user) {
        setEncryptionKey(null);
        setSigningKey(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const deriveKeys = async (password: string, uid: string) => {
    const encKey = await deriveKey(password, uid);
    const signKey = await deriveSigningKey(password, uid);
    setEncryptionKey(encKey);
    setSigningKey(signKey);
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      await deriveKeys(password, user.uid);
    } catch (err: any) {
      const message = getErrorMessage(err.code);
      setError(message);
      throw new Error(message, { cause: err });
    }
  };

  const signup = async (email: string, password: string, displayName: string) => {
    try {
      setError(null);
      const { user } = await createUserWithEmailAndPassword(auth, email, password);

      // Derive keys immediately
      await deriveKeys(password, user.uid);

      // Update profile with display name
      await updateProfile(user, { displayName });

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName,
        createdAt: serverTimestamp(),
      });
    } catch (err: any) {
      const message = getErrorMessage(err.code);
      setError(message);
      throw new Error(message, { cause: err });
    }
  };

  const unlock = async (password: string) => {
    if (!user) throw new Error('No user to unlock');
    try {
      setError(null);
      // Re-authenticate to verify password is correct (optional but good practice)
      if (!user.email) throw new Error('User email missing');

      await signInWithEmailAndPassword(auth, user.email, password);
      await deriveKeys(password, user.uid);
    } catch (err: any) {
      setError('Incorrect password');
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      setEncryptionKey(null);
      setSigningKey(null);
    } catch (err: any) {
      setError('Failed to log out');
      throw err;
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        encryptionKey,
        signingKey,
        isLocked,
        login,
        signup,
        logout,
        unlock,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function getErrorMessage(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered';
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters';
    case 'auth/user-not-found':
      return 'No account found with this email';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later';
    case 'auth/invalid-credential':
      return 'Invalid email or password';
    default:
      return 'An error occurred. Please try again';
  }
}
