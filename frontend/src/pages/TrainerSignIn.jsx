import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Award, ArrowRight, Lock, Mail, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';

export function TrainerSignIn() {
  const navigate = useNavigate();
  const { user, loading, trainerLogin, isTrainer } = useAuth();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!loading && user) {
      if (isTrainer) {
        navigate('/trainer/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, loading, isTrainer, navigate]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password');
      toast.error('Please enter both email and password');
      return;
    }

    setBusy(true);

    try {
      await trainerLogin(email.trim(), password);
      toast.success('Welcome back, Coach!');
      navigate('/trainer/dashboard');
    } catch (err) {
      const msg = err.message || 'Invalid trainer credentials';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Heading */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow mb-4">
            <Award className="h-7 w-7 text-primary-foreground" />
          </div>
          <span className="inline-block px-3 py-1 mb-2 text-xs font-semibold rounded-full bg-primary/20 text-primary border border-primary/30">
            Coach & Trainer Portal
          </span>
          <h1 className="font-display text-3xl font-bold">
            Trainer <span className="gradient-text">Sign In</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Access your coach dashboard, manage clients, and assign workout plans.
          </p>
        </div>

        {/* Form Container */}
        <div className="glass-strong rounded-2xl p-6 sm:p-8 shadow-elegant">
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-destructive/15 border border-destructive/30 text-rose-300 text-sm flex items-start gap-2.5">
              <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Trainer Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMsg('');
                  }}
                  className="w-full bg-input/60 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-ring border border-border/40 text-foreground text-sm"
                  placeholder="coach@example.com"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg('');
                  }}
                  className="w-full bg-input/60 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-ring border border-border/40 text-foreground text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 bg-gradient-primary text-primary-foreground py-3 rounded-xl font-semibold shadow-glow hover:opacity-90 transition-opacity text-sm disabled:opacity-50 mt-2"
            >
              {busy ? 'Signing In...' : 'Sign In as Trainer'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border/40 text-center space-y-2 text-xs text-muted-foreground">
            <p>
              New fitness coach?{' '}
              <Link to="/trainer/signup" className="text-primary font-medium hover:underline">
                Create Trainer Account
              </Link>
            </p>
            <p>
              Are you a client / fitness member?{' '}
              <Link to="/auth" className="text-muted-foreground hover:text-foreground underline">
                Member Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
