import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Dumbbell, LogOut, Menu, User as UserIcon, X, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from './Toast';

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout, isTrainer, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = () => {
    logout();
    toast.success('Signed out successfully');
    navigate('/');
  };

  const navItems = [
    { to: '/', label: 'Home' },
    { to: '/workouts', label: 'Workouts' },
    { to: '/nutrition', label: 'Nutrition' },
    { to: '/trainers', label: 'Trainers' },
    { to: '/chatbot', label: 'AI Coach' },
    { to: '/pricing', label: 'Pricing' },
    {
      to: isAdmin ? '/admin/dashboard' : isTrainer ? '/trainer/dashboard' : '/dashboard',
      label: isAdmin ? 'Admin Dashboard' : isTrainer ? 'Trainer Dashboard' : 'Dashboard',
    },
    { to: '/about', label: 'About' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="glass border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow group-hover:scale-105 transition-transform">
              <Dumbbell className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">
              Fit<span className="gradient-text">AI</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to || (item.to.includes('/trainer/') && location.pathname.startsWith('/trainer'));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'text-foreground bg-secondary/80'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Auth State Button */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 rounded-lg bg-secondary/50">
                  {isTrainer ? (
                    <Award className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <UserIcon className="h-3.5 w-3.5" />
                  )}
                  <span className="font-medium text-foreground">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  {isAdmin ? (
                    <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded font-bold uppercase">
                      Admin
                    </span>
                  ) : isTrainer ? (
                    <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold uppercase">
                      Coach
                    </span>
                  ) : null}
                </span>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 hover:bg-secondary text-xs font-medium transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5 mr-0.5" /> Sign out
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/trainer/signin"
                  className="glass border border-border/60 hover:bg-secondary text-foreground text-xs font-semibold px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Award className="h-3.5 w-3.5 text-primary" /> Coach Portal
                </Link>
                <Link
                  to="/auth"
                  className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow px-4 py-2 rounded-lg text-xs font-semibold transition-opacity"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden rounded-lg p-2 hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {open && (
          <div className="md:hidden border-t border-border/40 px-4 py-3 space-y-1 animate-fade-up">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="block px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <button
                onClick={() => {
                  setOpen(false);
                  handleSignOut();
                }}
                className="block w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              >
                Sign out
              </button>
            ) : (
              <div className="pt-2 border-t border-border/40 space-y-2">
                <Link
                  to="/auth"
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm text-primary hover:bg-secondary/60 font-semibold"
                >
                  Member Sign In
                </Link>
                <Link
                  to="/trainer/signin"
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 flex items-center gap-1.5"
                >
                  <Award className="h-4 w-4 text-primary" /> Trainer / Coach Portal
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
