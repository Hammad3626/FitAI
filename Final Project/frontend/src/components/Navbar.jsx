// Simple Navbar component
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Dumbbell, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/Button';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/workouts', label: 'Workouts' },
  { to: '/nutrition', label: 'Nutrition' },
  { to: '/chatbot', label: 'AI Coach' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/about', label: 'About' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    const { success } = await signOut();
    if (success) {
      toast.success('Signed out');
      navigate('/');
    }
  };

  const isActive = (path) => location.pathname === path;

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
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive(item.to)
                    ? 'text-foreground bg-secondary/80'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground px-2">
                  {user.user_metadata?.display_name || user.email?.split('@')[0]}
                </span>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-1" /> Sign out
                </Button>
              </>
            ) : (
              <Button asChild size="sm" className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden rounded-lg p-2 hover:bg-secondary/60"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border/40 px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="block px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  handleSignOut();
                }}
                className="block w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              >
                Sign out
              </button>
            ) : (
              <Link
                to="/auth"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm text-primary hover:bg-secondary/60"
              >
                Sign In
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
