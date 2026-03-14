import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import logo from '@/assets/images/logo.png';

const ResetPassword: React.FC = () => {
  const { resetPassword } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('This reset link is missing or invalid.');
      return;
    }

    if (!password || !confirmPassword) {
      setError('Both password fields are required');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    const result = await resetPassword(token, password);
    setIsSubmitting(false);

    if (!result) {
      setError('Unable to reset password');
      return;
    }

    if (result.toLowerCase().includes('invalid') || result.toLowerCase().includes('expired') || result.toLowerCase().includes('unable')) {
      setError(result);
      return;
    }

    setMessage(result);
    window.setTimeout(() => navigate('/login'), 1500);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 font-poppins">
      <div className="w-full max-w-[500px]">
        <div className="text-center mb-8">
          <img src={logo} alt="Logo" className="h-12 w-12 mx-auto mb-3 invert" />
          <h1 className="text-2xl font-bold text-foreground">Choose a new password</h1>
          <p className="text-muted-foreground mt-1">Set a new password for your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl">{error}</div>}
          {message && <div className="text-sm text-foreground bg-primary/10 p-3 rounded-xl">{message}</div>}

          <div>
            <label className="text-sm text-muted-foreground">New password</label>
            <input
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              className="w-full mt-1 p-3 rounded-xl bg-secondary/60 text-foreground border border-border/50 outline-none focus:border-primary/50"
              placeholder="Enter your new password"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={event => setConfirmPassword(event.target.value)}
              className="w-full mt-1 p-3 rounded-xl bg-secondary/60 text-foreground border border-border/50 outline-none focus:border-primary/50"
              placeholder="Confirm your new password"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full p-3 rounded-xl bg-primary text-primary-foreground font-semibold transition-all hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting ? 'Resetting...' : 'Reset password'}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Need a new link? <Link to="/forgot-password" className="text-primary font-medium">Request another</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;