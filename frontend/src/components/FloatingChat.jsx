import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, Sparkles, X, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const SUGGESTIONS = [
  'Build me a custom routine',
  'Workout for today based on my goal',
  'Best diet for weight loss?',
];

export function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fitnessContext, setFitnessContext] = useState(null);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hey 👋 I'm your AI fitness coach. Ask me about workouts, nutrition, or recovery — anything to help you move better.",
    },
  ]);

  const { user } = useAuth();
  const scrollRef = useRef(null);

  // Load user fitness context if user is signed in
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
    if (!trimmed || loading) return;

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
      setMessages([
        ...next,
        { role: 'assistant', content: 'Something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary shadow-glow animate-pulse-glow hover:scale-110 transition-transform"
        aria-label="Open AI coach"
      >
        {open ? (
          <X className="h-6 w-6 text-primary-foreground" />
        ) : (
          <MessageCircle className="h-6 w-6 text-primary-foreground" />
        )}
      </button>

      {/* Floating Chat Modal */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] sm:w-[400px] h-[560px] glass-strong rounded-2xl shadow-elegant flex flex-col overflow-hidden animate-fade-up">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold">FitAI Coach</p>
              <p className="text-xs text-muted-foreground">Online · 24/7 AI Coach</p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start gap-2.5'}
              >
                {m.role === 'assistant' && (
                  <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-primary">
                    <Bot className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                )}
                {m.role === 'assistant' ? (
                  <div className="max-w-[85%] text-xs sm:text-sm leading-relaxed text-foreground prose prose-invert prose-xs max-w-none">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-gradient-primary text-primary-foreground px-3.5 py-2 text-xs sm:text-sm">
                    {m.content}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-primary">
                  <Bot className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="typing-dot h-2 w-2 rounded-full bg-primary" style={{ animationDelay: '0s' }} />
                  <span className="typing-dot h-2 w-2 rounded-full bg-primary" style={{ animationDelay: '0.15s' }} />
                  <span className="typing-dot h-2 w-2 rounded-full bg-primary" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            )}

            {messages.length === 1 && !loading && (
              <div className="flex flex-wrap gap-2 pt-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="text-xs px-3 py-1.5 rounded-full glass hover:bg-secondary transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="border-t border-border/40 p-3 flex gap-2"
          >
            <input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything fitness…"
              className="flex-1 bg-input/60 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-gradient-primary text-primary-foreground hover:opacity-90 px-3.5 py-2 rounded-xl transition-opacity disabled:opacity-50 shrink-0"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
