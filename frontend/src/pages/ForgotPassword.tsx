import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import logo from '@/assets/images/logo.png';

const ForgotPassword: React.FC = () => {
  const { requestPasswordReset } = useApp();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    setIsSubmitting(true);
    const result = await requestPasswordReset(email.trim());
    setIsSubmitting(false);

    if (!result) {
      setError('Unable to send reset email');
      return;
    }

    if (result.toLowerCase().includes('unable')) {
      setError(result);
      return;
    }

    setMessage(result);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 font-poppins">
      <div className="w-full max-w-[500px]">
        <div className="text-center mb-8">
          <img src={logo} alt="Logo" className="h-12 w-12 mx-auto mb-3 invert" />
          <h1 className="text-2xl font-bold text-foreground">Reset password</h1>
          <p className="text-muted-foreground mt-1">Enter your email and we’ll send you a reset link.</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl">{error}</div>}
          {message && <div className="text-sm text-foreground bg-primary/10 p-3 rounded-xl">{message}</div>}

          <div>
            <label className="text-sm text-muted-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              className="w-full mt-1 p-3 rounded-xl bg-secondary/60 text-foreground border border-border/50 outline-none focus:border-primary/50"
              placeholder="Enter your email"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full p-3 rounded-xl bg-primary text-primary-foreground font-semibold transition-all hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting ? 'Sending...' : 'Send reset link'}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Remembered it? <Link to="/login" className="text-primary font-medium">Back to sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;