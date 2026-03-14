import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useNavigate, Link } from 'react-router-dom';
import greenImage from '@/assets/images/green.jpg';

const Signup: React.FC = () => {
  const { signup } = useApp();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !email || !password) { setError('All fields are required'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setIsSubmitting(true);
    try {
      const err = await signup(username, email, password);
      if (err) { setError(err); return; }
      navigate('/');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-dvh min-h-dvh overflow-hidden bg-background font-poppins lg:h-screen lg:min-h-screen lg:flex lg:overflow-hidden">
      <div className="hidden lg:block lg:w-3/4 lg:h-screen">
        <img src={greenImage} alt="Green background" className="h-full w-full object-cover" />
      </div>

      <div className="w-full lg:w-1/4 h-full lg:min-h-0 flex items-center justify-center px-3 lg:px-6 py-3 lg:py-8">
        <div className="w-full max-w-[500px] min-w-0">
          <div className="mb-1 md:mb-2 md:px-6 px-4">
           
            <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
            <p className="text-muted-foreground mt-1">Start tracking your time and income</p>
          </div>

          <form onSubmit={handleSubmit} className="glass-card auth-card w-full min-w-0 px-3 py-4 md:p-6 space-y-3 md:space-y-4">
            {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl">{error}</div>}

            <div>
              <label className="text-sm text-muted-foreground">Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                className="auth-input w-full mt-1 p-3 rounded-xl bg-secondary/60 text-foreground border outline-none"
                placeholder="Choose a username" />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="auth-input w-full mt-1 p-3 rounded-xl bg-secondary/60 text-foreground border outline-none"
                placeholder="Enter your email" />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Password</label>
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                className="auth-input w-full mt-1 p-3 rounded-xl bg-secondary/60 text-foreground border outline-none"
                placeholder="Create a password" />
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input type="checkbox" checked={showPassword} onChange={e => setShowPassword(e.target.checked)}
                  className="w-5 h-5 rounded accent-primary" />
                <span className="text-sm text-muted-foreground">See password</span>
              </label>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full p-3 rounded-xl bg-primary text-primary-foreground font-semibold transition-all hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center">
              {isSubmitting ? (
                <span className="dot-loader" aria-label="Signing up">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              ) : 'Sign Up'}
            </button>

            <p className="text-[14px] text-muted-foreground">
              Already have an account? <Link to="/login" className="text-primary font-medium">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
