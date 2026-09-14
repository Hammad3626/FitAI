import { Link, useNavigate } from "@tanstack/react-router";
import { Dumbbell, LogOut, Menu, User as UserIcon, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/workouts", label: "Workouts" },
  { to: "/nutrition", label: "Nutrition" },
  { to: "/chatbot", label: "AI Coach" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/about", label: "About" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  async function handleSignOut() {
    await signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="glass border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow group-hover:scale-105 transition-transform">
              <Dumbbell className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">
              Fit<span className="gradient-text">AI</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="px-3 py-2 text-sm font-medium text-muted-foreground rounded-lg hover:text-foreground hover:bg-secondary/60 transition-colors"
                activeProps={{ className: "px-3 py-2 text-sm font-medium rounded-lg text-foreground bg-secondary/80" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <span className="flex items-center gap-2 text-sm text-muted-foreground px-2">
                  <UserIcon className="h-4 w-4" />
                  {user.user_metadata?.display_name || user.email?.split("@")[0]}
                </span>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-1" /> Sign out
                </Button>
              </>
            ) : (
              <Button asChild className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </div>

          <button
            className="md:hidden rounded-lg p-2 hover:bg-secondary/60"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="md:hidden border-t border-border/40 px-4 py-3 space-y-1">
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
              <button onClick={() => { setOpen(false); handleSignOut(); }} className="block w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60">
                Sign out
              </button>
            ) : (
              <Link to="/auth" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-primary hover:bg-secondary/60">
                Sign In
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
