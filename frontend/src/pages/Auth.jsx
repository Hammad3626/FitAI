import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';

export function Auth() {
  const navigate = useNavigate();
  const { user, loading, login, register } = useAuth();
  const [tab, setTab] = useState('signin');
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'trainer') {
        navigate('/trainer/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, loading, navigate]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await login(email, password);
      toast.success('Welcome back!');
      if (data.user?.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (data.user?.role === 'trainer') {
        navigate('/trainer/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.message || 'Invalid credentials');
    } finally {
      setBusy(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await register(email, password, displayName);
      toast.success('Account created! Welcome to FitAI.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Failed to create account');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Heading */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow mb-4">
            <Dumbbell className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold">
            Welcome to <span className="gradient-text">FitAI</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your AI-powered fitness companion
          </p>
        </div>

        {/* Form Container */}
        <div className="glass-strong rounded-2xl p-6 shadow-elegant">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-secondary/80 rounded-xl mb-6">
            <button
              onClick={() => setTab('signin')}
              className={`py-2 text-sm font-medium rounded-lg transition-colors ${
                tab === 'signin'
                  ? 'bg-gradient-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setTab('signup')}
              className={`py-2 text-sm font-medium rounded-lg transition-colors ${
                tab === 'signup'
                  ? 'bg-gradient-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign Up
            </button>
          </div>

          {tab === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Email or Username</label>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-input/60 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-ring border border-border/40 text-foreground"
                  placeholder="name@example.com"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-input/60 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-ring border border-border/40 text-foreground"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full bg-gradient-primary text-primary-foreground py-3 rounded-xl font-semibold shadow-glow hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {busy ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full bg-input/60 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-ring border border-border/40 text-foreground"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-input/60 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-ring border border-border/40 text-foreground"
                  placeholder="alex@example.com"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-input/60 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-ring border border-border/40 text-foreground"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full bg-gradient-primary text-primary-foreground py-3 rounded-xl font-semibold shadow-glow hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {busy ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 text-center space-y-2 text-xs text-muted-foreground">
          <p>
            Are you a fitness trainer or coach?{' '}
            <Link to="/trainer/signin" className="text-primary font-medium hover:underline">
              Trainer Sign In / Registration →
            </Link>
          </p>
          <p>
            <Link to="/" className="hover:text-foreground transition-colors">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
