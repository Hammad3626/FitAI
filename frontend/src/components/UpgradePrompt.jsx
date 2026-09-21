import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Shield, ArrowRight, X, Check } from 'lucide-react';

export function UpgradePrompt({
  open,
  onClose,
  title = 'Premium Feature',
  description = 'This feature is available on a higher plan. Upgrade to unlock full access.',
  requiredPlan = 'basic', // 'basic' | 'pro'
  featureList = [],
}) {
  const navigate = useNavigate();

  if (!open) return null;

  const planLabel = requiredPlan.toUpperCase();
  const planColor = requiredPlan === 'pro' ? 'from-amber-500 to-rose-500' : 'from-primary to-cyan-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fade-up">
      <div className="glass-strong rounded-3xl max-w-md w-full p-6 sm:p-8 border border-border/50 shadow-2xl relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon & Badge */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${planColor} flex items-center justify-center text-white shadow-glow`}>
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
              {planLabel} Plan Required
            </span>
            <h3 className="font-display text-xl font-bold mt-1 text-foreground">{title}</h3>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed mb-5">
          {description}
        </p>

        {featureList.length > 0 && (
          <div className="glass rounded-xl p-3.5 mb-6 space-y-2 border border-border/40">
            <p className="text-xs font-semibold text-foreground/90 uppercase tracking-wider">
              Included in {planLabel}:
            </p>
            {featureList.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              onClose?.();
              navigate('/pricing');
            }}
            className="flex-1 bg-gradient-primary text-primary-foreground py-3 rounded-xl font-semibold shadow-glow hover:opacity-95 transition-opacity flex items-center justify-center gap-2 text-sm"
          >
            Upgrade to {planLabel} <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 rounded-xl glass border border-border/60 hover:bg-secondary text-xs font-semibold transition-colors text-muted-foreground hover:text-foreground"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
