import React, { useEffect, useRef, useState } from 'react';
import { Send, Sparkles, Bot, Lock, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const PROMPTS = [
  'Workout plan for beginners',
  'Best diet for weight loss?',
  'How much protein should I eat?',
  'How to recover faster after training?',
  "What's a good warm-up routine?",
];

// Daily limits by plan (mirrors backend)
const PLAN_LIMITS = { free: 5, basic: 50, pro: Infinity };

export function Chatbot() {
  const { user, subscription } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hi, I'm FitAI 👋 — your personal AI fitness coach. Ask me anything about workouts, nutrition, recovery, or building a routine that sticks.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fitnessContext, setFitnessContext] = useState(null);
  const [limitReached, setLimitReached] = useState(false);
  const scrollRef = useRef(null);

  // Load user fitness context if signed in
  useEffect(() => {
    if (!user) {
      setFitnessContext(null);
      return;
    }
    api.get('/fitness-data')
      .then((data) => {
        if (data) {
          setFitnessContext({
            displayName: user.displayName || user.email?.split('@')[0],
            goal: data.goal,
            weeklyTarget: data.weeklyTarget,
            workoutsThisWeek: data.workoutsThisWeek,
            waterCups: data.waterCups,
            savedWorkouts: data.savedWorkouts,
          });
        }
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading || limitReached) return;

    const next = [...messages, { role: 'user', content: trimmed }];
    setMessages(next);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chat', {
        messages: next,
        fitnessContext,
      });
      setMessages([...next, { role: 'assistant', content: res.reply }]);
    } catch (e) {
      console.error(e);
      // Handle 403 limit-reached from backend
      if (e?.status === 403 || e?.message?.toLowerCase().includes('limit')) {
        setLimitReached(true);
        setMessages([
          ...next,
          {
            role: 'assistant',
            content: "You've reached your daily AI query limit. Upgrade your plan for more queries.",
          },
        ]);
      } else {
        setMessages([
          ...next,
          { role: 'assistant', content: 'Network error reaching the AI coach. Please try again.' },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Compute query info from subscription
  const planId = subscription?.planId || 'free';
  const dailyLimit = PLAN_LIMITS[planId] ?? 5;
  const queriesUsed = subscription?.dailyAiQueriesUsed ?? 0;
  const isLimited = dailyLimit !== Infinity;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
      <header className="text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-medium text-muted-foreground mb-4">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Live AI Coach
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold">
          Talk to your <span className="gradient-text">AI Coach</span>
        </h1>
        <p className="mt-3 text-muted-foreground">
          Personalized, evidence-based fitness guidance — anytime.
        </p>
      </header>

      {/* Query limit banner — only shown when signed in and on a limited plan */}
      {user && isLimited && (
        <div className={`mb-4 flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-xs font-medium border ${
          limitReached
            ? 'bg-red-500/10 border-red-500/30 text-red-400'
            : queriesUsed >= dailyLimit - 1
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            : 'glass border-border/40 text-muted-foreground'
        }`}>
          <span>
            {limitReached
              ? `Daily limit reached (${dailyLimit} queries). Resets tomorrow.`
              : `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan: ${Math.max(0, dailyLimit - queriesUsed)} / ${dailyLimit} queries remaining today`}
          </span>
          {(limitReached || queriesUsed >= Math.floor(dailyLimit * 0.8)) && (
            <Link
              to="/pricing"
              className="flex items-center gap-1 shrink-0 bg-gradient-primary text-primary-foreground px-3 py-1 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              <Zap className="h-3 w-3" /> Upgrade
            </Link>
          )}
        </div>
      )}

      <div className="glass-strong rounded-3xl flex flex-col h-[70vh] overflow-hidden shadow-elegant border border-border/40">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 space-y-5">
          {messages.map((m, i) => (
            <div
              key={i}
              className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start gap-3'}
            >
              {m.role === 'assistant' && (
                <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              {m.role === 'assistant' ? (
                <div className="max-w-[85%] text-sm sm:text-base leading-relaxed whitespace-pre-wrap prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : (
                <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-gradient-primary text-primary-foreground px-4 py-2.5 text-sm sm:text-base">
                  {m.content}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="typing-dot h-2 w-2 rounded-full bg-primary" style={{ animationDelay: '0s' }} />
                <span className="typing-dot h-2 w-2 rounded-full bg-primary" style={{ animationDelay: '0.15s' }} />
                <span className="typing-dot h-2 w-2 rounded-full bg-primary" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
          )}

          {messages.length === 1 && !loading && (
            <div className="flex flex-wrap gap-2 pt-2">
              {PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => handleSend(p)}
                  className="text-xs sm:text-sm px-3.5 py-2 rounded-full glass hover:bg-secondary transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Limit reached upgrade card inside chat */}
          {limitReached && (
            <div className="glass rounded-2xl p-5 border border-red-500/20 text-center">
              <Lock className="h-7 w-7 text-red-400 mx-auto mb-2" />
              <p className="font-semibold text-sm mb-1">Daily Limit Reached</p>
              <p className="text-xs text-muted-foreground mb-4">
                Upgrade to Basic (50/day) or Pro (unlimited) for more AI Coach queries.
              </p>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 bg-gradient-primary text-primary-foreground px-5 py-2 rounded-xl text-sm font-semibold shadow-glow hover:opacity-90 transition-opacity"
              >
                <Zap className="h-4 w-4" /> View Plans
              </Link>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="border-t border-border/40 p-4 flex gap-2"
        >
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={limitReached ? 'Daily limit reached — upgrade to continue' : 'Ask anything fitness…'}
            disabled={limitReached}
            className="flex-1 bg-input/60 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground border border-border/30 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || limitReached}
            className="bg-gradient-primary text-primary-foreground hover:opacity-90 px-5 rounded-xl font-medium transition-opacity disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
