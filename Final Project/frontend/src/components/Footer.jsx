// Simple Footer component
import { Dumbbell, Mail, Github, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-secondary/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
                <Dumbbell className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-display font-semibold">FitAI</span>
            </div>
            <p className="text-sm text-muted-foreground">Your AI-powered fitness coach, available 24/7.</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/workouts" className="hover:text-foreground">Workouts</a></li>
              <li><a href="/nutrition" className="hover:text-foreground">Nutrition</a></li>
              <li><a href="/chatbot" className="hover:text-foreground">AI Coach</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/about" className="hover:text-foreground">About</a></li>
              <li><a href="#" className="hover:text-foreground">Contact</a></li>
              <li><a href="#" className="hover:text-foreground">Privacy</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Connect</h3>
            <div className="flex gap-3">
              <a href="#" className="text-muted-foreground hover:text-foreground"><Mail className="h-5 w-5" /></a>
              <a href="#" className="text-muted-foreground hover:text-foreground"><Github className="h-5 w-5" /></a>
              <a href="#" className="text-muted-foreground hover:text-foreground"><Twitter className="h-5 w-5" /></a>
            </div>
          </div>
        </div>

        <div className="border-t border-border/40 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 FitAI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
