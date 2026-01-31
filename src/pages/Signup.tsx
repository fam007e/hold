import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import './Auth.css';

import { checkPwnedPassword } from '@/lib/pwned';

export function Signup() {
  const { user, signup, error, clearError, loading } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [pwnedWarning, setPwnedWarning] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="auth">
        <div className="auth__loading">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handlePasswordBlur = async () => {
    if (password.length >= 4) {
      const result = await checkPwnedPassword(password);
      if (result.isPwned) {
        setPwnedWarning(`⚠️ This password has been seen in ${result.count.toLocaleString()} data breaches. Please choose a safer one.`);
      } else {
        setPwnedWarning(null);
      }
    } else {
      setPwnedWarning(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    // Optional: Block if pwned
    if (pwnedWarning) {
      // We could block here, but generally just showing the warning is enough for UX.
      // Let's scroll to it or highlight it.
    }

    setIsSubmitting(true);

    try {
      await signup(email, password, displayName);
    } catch {
      // Error is handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="auth">
      <div className="auth__card">
        <div className="auth__header">
          <span className="auth__logo">⏳</span>
          <h1>Create account</h1>
          <p>Start tracking what the world owes you</p>
        </div>

        <form onSubmit={handleSubmit} className="auth__form">
          {displayError && (
            <div className="auth__error">
              {displayError}
            </div>
          )}

          <div className="auth__field">
            <label htmlFor="displayName">Name</label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              required
              autoComplete="name"
            />
          </div>

          <div className="auth__field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="auth__field">
            <label htmlFor="password">Password</label>
            <div className="auth__password-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (pwnedWarning) setPwnedWarning(null); // Clear warning on change
                }}
                onBlur={handlePasswordBlur}
                placeholder="At least 6 characters"
                required
                autoComplete="new-password"
                style={pwnedWarning ? { borderColor: '#eab308' } : {}}
              />
              <button
                type="button"
                className="auth__password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {pwnedWarning && (
              <div style={{ color: '#ca8a04', fontSize: '0.8rem', marginTop: '0.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.25rem' }}>
                {pwnedWarning}
              </div>
            )}
          </div>

          <div className="auth__field">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              required
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="auth__submit"
            disabled={isSubmitting}
          >
            <UserPlus size={18} />
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth__footer">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
