import React, { useEffect, useRef, useState } from 'react';
import { Send, Sparkles, Sliders, RefreshCw, Wand2, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const QUICK_ACTIONS = [
  {
    label: 'Build custom routine',
    prompt:
      'Create a custom workout routine for me. Ask me what you need to know (equipment, days/week, time per session, injuries, focus) and then build a fully personalized plan with warm-up, main sets table, and cool-down.',
  },
  {
    label: 'Plan my week',
    prompt:
      'Build me a custom weekly workout schedule (Mon–Sun table) that matches my goal and weekly target. Use my saved routines if relevant.',
  },
  {
    label: "Today's workout",
    prompt:
      'Give me ONE custom workout for today based on my goal and weekly progress. Use the structured routine format.',
  },
  {
    label: 'Adapt to today',
    prompt:
      'I want to train but adapt to how I feel right now. Ask about my energy, soreness, time available and equipment, then give me a fitting routine.',
  },
  {
    label: 'Diet for my goal',
    prompt:
      'Build a custom one-day meal plan with macros for my goal. Ask about restrictions or calorie target if needed.',
  },
];

const miniInput =
  'w-full bg-input/60 rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring border border-border/40';

function Mini({ label, children }) {
  return (
    <div>
      <label className="text-[10px] text-muted-foreground block mb-1">{label}</label>
      {children}
    </div>
  );
}

export function CoachPanel({ fitnessData }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Controls state
  const [showConstraints, setShowConstraints] = useState(false);
  const [level, setLevel] = useState('Beginner');
  const [intensity, setIntensity] = useState('Moderate');
  const [timeMin, setTimeMin] = useState(30);
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [equipment, setEquipment] = useState('');
  const [focus, setFocus] = useState('');
  const [injuries, setInjuries] = useState('');
  const [energy, setEnergy] = useState(7);

  useEffect(() => {
    const name = user?.displayName || user?.email?.split('@')[0] || '';
    const goal = fitnessData?.goal ? ` I see your goal is "${fitnessData.goal}".` : '';
    setMessages([
      {
        role: 'assistant',
        content: `Hey ${name} 👋${goal} Ask me for a workout, a meal idea, or use a quick action below.`,
      },
    ]);
  }, [user, fitnessData?.goal]);

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
        fitnessContext: {
          displayName: user?.displayName || user?.email?.split('@')[0],
          goal: fitnessData?.goal,
          weeklyTarget: fitnessData?.weeklyTarget,
          workoutsThisWeek: fitnessData?.workoutsThisWeek,
          waterCups: fitnessData?.waterCups,
          savedWorkouts: fitnessData?.savedWorkouts,
        },
      });
      setMessages([...next, { role: 'assistant', content: res.reply }]);
    } catch {
      setMessages([
        ...next,
        { role: 'assistant', content: 'Something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const hasRoutine = messages.some(
    (m) => m.role === 'assistant' && /###\s|Main sets|Warm-up/i.test(m.content)
  );

  const buildConstraintsLine = () => {
    const parts = [
      `Level: ${level}`,
      `Time available: ${timeMin} min`,
      `Days/week: ${daysPerWeek}`,
      `Intensity: ${intensity}`,
      `Energy today: ${energy}/10`,
    ];
    if (equipment.trim()) parts.push(`Equipment: ${equipment.trim()}`);
    if (focus.trim()) parts.push(`Focus: ${focus.trim()}`);
    if (injuries.trim()) parts.push(`Injuries: ${injuries.trim()}`);
    return parts.join(' · ');
  };

  const handleRegenerate = () => {
    const line = buildConstraintsLine();
    const verb = hasRoutine ? 'Regenerate the last routine' : 'Build me a routine';
    handleSend(
      `${verb} adapted to my current situation — ${line}. Use the structured routine format (### title, warm-up, main sets table, cool-down, coach notes).`
    );
  };

  const handleApplyToNew = () => {
    const line = buildConstraintsLine();
    handleSend(
      `Build me a brand new routine that fits these constraints: ${line}. Use the structured routine format.`
    );
  };

  return (
    <div className="glass-strong rounded-2xl p-6 flex flex-col h-[580px]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold">AI Coach Assistant</h2>
          <p className="text-xs text-muted-foreground">Personalized to your goal & activity</p>
        </div>
      </div>

      {/* Quick Action Chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.label}
            onClick={() => handleSend(a.prompt)}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full glass hover:bg-secondary transition-colors disabled:opacity-50"
          >
            <Wand2 className="h-3 w-3 text-primary" />
            {a.label}
          </button>
        ))}
      </div>

      {/* Routine Controls Toggle */}
      <div className="mb-3">
        <button
          type="button"
          onClick={() => setShowConstraints((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Sliders className="h-3 w-3" />
          {showConstraints ? 'Hide' : 'Tweak'} routine controls
        </button>

        {showConstraints && (
          <div className="mt-2 glass rounded-xl p-3 space-y-2.5 animate-fade-up">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Mini label="Level">
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className={miniInput}
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </Mini>
              <Mini label="Intensity">
                <select
                  value={intensity}
                  onChange={(e) => setIntensity(e.target.value)}
                  className={miniInput}
                >
                  <option>Easy</option>
                  <option>Moderate</option>
                  <option>Hard</option>
                </select>
              </Mini>
              <Mini label="Duration">
                <select
                  value={timeMin}
                  onChange={(e) => setTimeMin(Number(e.target.value))}
                  className={miniInput}
                >
                  <option value={20}>20 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                </select>
              </Mini>
              <Mini label="Days/wk">
                <select
                  value={daysPerWeek}
                  onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                  className={miniInput}
                >
                  <option value={2}>2 days</option>
                  <option value={3}>3 days</option>
                  <option value={4}>4 days</option>
                  <option value={5}>5 days</option>
                </select>
              </Mini>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Mini label="Equipment">
                <input
                  value={equipment}
                  onChange={(e) => setEquipment(e.target.value)}
                  placeholder="e.g. dumbbells, gym"
                  className={miniInput}
                />
              </Mini>
              <Mini label="Target Focus">
                <input
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  placeholder="e.g. upper body, core"
                  className={miniInput}
                />
              </Mini>
              <Mini label="Injuries / Limits">
                <input
                  value={injuries}
                  onChange={(e) => setInjuries(e.target.value)}
                  placeholder="e.g. knee, shoulder"
                  className={miniInput}
                />
              </Mini>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleRegenerate}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
              >
                <RefreshCw className="h-3 w-3" /> {hasRoutine ? 'Regenerate Routine' : 'Build Routine'}
              </button>
              <button
                type="button"
                onClick={handleApplyToNew}
                className="text-xs px-3 py-1.5 rounded-lg bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Build Fresh Split
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Messages Window */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto pr-2 space-y-4">
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
              <div className="max-w-[90%] text-xs sm:text-sm leading-relaxed text-foreground prose prose-invert prose-xs max-w-none">
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
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="mt-4 pt-3 border-t border-border/40 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask for routine tweaks, nutrition, or recovery…"
          className="flex-1 bg-input/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-gradient-primary text-primary-foreground hover:opacity-90 px-4 py-2.5 rounded-xl text-sm font-medium transition-opacity disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
