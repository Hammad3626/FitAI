import React from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/50 glass">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary">
                <Dumbbell className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-semibold">
                Fit<span className="gradient-text">AI</span>
              </span>
            </div>
            <p className="mt-4 max-w-md text-sm text-muted-foreground">
              An AI-powered fitness guidance platform offering personalized workouts,
              nutrition advice, and a 24/7 conversational coach.
            </p>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold mb-3">Explore</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/workouts" className="hover:text-foreground transition-colors">
                  Workouts
                </Link>
              </li>
              <li>
                <Link to="/nutrition" className="hover:text-foreground transition-colors">
                  Nutrition
                </Link>
              </li>
              <li>
                <Link to="/chatbot" className="hover:text-foreground transition-colors">
                  AI Coach
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-foreground transition-colors">
                  About
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/40 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} FitAI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
