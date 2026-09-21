import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Send, X, Bot, ArrowLeft } from 'lucide-react';

const STEPS = [
  {
    key: 'goal',
    question: "What's your main fitness goal?",
    options: ['Weight Loss', 'Muscle Gain', 'Strength', 'Endurance', 'General Fitness'],
  },
  {
    key: 'level',
    question: "What's your experience level?",
    options: ['Beginner', 'Intermediate', 'Advanced'],
  },
  {
    key: 'gender',
    question: "What's your gender?",
    options: ['Male', 'Female', 'Other / Prefer not to say'],
  },
  {
    key: 'age',
    question: 'How old are you?',
    placeholder: 'e.g. 27',
    type: 'number',
  },
  {
    key: 'height',
    question: "What's your height?",
    placeholder: 'e.g. 175 cm or 5\'9"',
  },
  {
    key: 'weight',
    question: "What's your current weight?",
    placeholder: 'e.g. 72 kg or 160 lbs',
  },
  {
    key: 'daysPerWeek',
    question: 'How many days per week can you train?',
    options: ['2', '3', '4', '5', '6'],
  },
  {
    key: 'timeMin',
    question: 'How long per session (minutes)?',
    options: ['20', '30', '45', '60', '75', '90'],
  },
  {
    key: 'location',
    question: 'Where will you work out?',
    options: ['Home', 'Gym', 'Both'],
  },
  {
    key: 'equipment',
    question: 'What equipment do you have?',
    placeholder: 'dumbbells, bands, bodyweight only…',
    optional: true,
  },
  {
    key: 'injuries',
    question: "Any injuries or limitations? (type 'none' if not)",
    placeholder: 'e.g. left knee, lower back',
  },
  {
    key: 'style',
    question: 'Preferred workout style?',
    options: ['Cardio', 'Strength', 'HIIT', 'Yoga', 'Mixed'],
  },
  {
    key: 'targetAreas',
    question: 'Target body areas?',
    options: [
      'Full Body',
      'Upper Body',
      'Lower Body',
      'Chest',
      'Back',
      'Arms',
      'Legs',
      'Core',
      'Glutes',
    ],
  },
];

export function RoutineBuilderChat({ open, onClose, onComplete, generating }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (open) {
      setStepIdx(0);
      setAnswers({});
      setMessages([
        {
          role: 'bot',
          text: "Hey! I'm your AI fitness coach. Answer a few quick questions and I'll build a routine made just for you.",
        },
        { role: 'bot', text: STEPS[0].question },
      ]);
      setInput('');
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, generating]);

  if (!open) return null;

  const step = STEPS[stepIdx];
  const isDone = stepIdx >= STEPS.length;

  const submitAnswer = (value) => {
    const v = (value || '').trim();
    if (!v) return;

    const newAnswers = { ...answers, [step.key]: v };
    setAnswers(newAnswers);

    const nextIdx = stepIdx + 1;
    const nextMessages = [...messages, { role: 'user', text: v }];

    if (nextIdx < STEPS.length) {
      nextMessages.push({ role: 'bot', text: STEPS[nextIdx].question });
    } else {
      nextMessages.push({ role: 'bot', text: 'Got it! Building your personalized routine now…' });
    }

    setMessages(nextMessages);
    setInput('');
    setStepIdx(nextIdx);

    if (nextIdx >= STEPS.length) {
      onComplete(newAnswers);
    }
  };

  const goBack = () => {
    if (stepIdx === 0) return;
    const prevIdx = stepIdx - 1;
    setStepIdx(prevIdx);
    setMessages((m) => {
      const trimmed = [...m];
      while (trimmed.length && trimmed[trimmed.length - 1].role === 'bot') trimmed.pop();
      if (trimmed.length && trimmed[trimmed.length - 1].role === 'user') trimmed.pop();
      trimmed.push({ role: 'bot', text: STEPS[prevIdx].question });
      return trimmed;
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-up"
      onClick={() => !generating && onClose()}
    >
      <div
        className="glass-strong rounded-2xl max-w-xl w-full max-h-[88vh] flex flex-col shadow-elegant overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-border/40 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-lg font-bold leading-tight">AI Routine Coach</h3>
            <div className="mt-1 h-1.5 bg-secondary/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-primary transition-all duration-300"
                style={{ width: `${Math.min(100, (stepIdx / STEPS.length) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {isDone ? 'All set' : `Question ${stepIdx + 1} of ${STEPS.length}`}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={generating}
            className="text-muted-foreground hover:text-foreground disabled:opacity-50 p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Message History */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : ''}`}>
              {m.role === 'bot' && (
                <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-primary">
                  <Bot className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === 'user'
                    ? 'bg-gradient-primary text-primary-foreground rounded-br-sm'
                    : 'glass text-foreground'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {generating && (
            <div className="flex items-center gap-2 text-primary text-sm pt-2">
              <Sparkles className="h-4 w-4 animate-spin" />
              <span>Generating your custom split…</span>
            </div>
          )}
        </div>

        {/* Action / Input Footer */}
        {!isDone && !generating && (
          <div className="p-4 border-t border-border/40 bg-background/50 space-y-3">
            {step?.options ? (
              <div className="flex flex-wrap gap-2">
                {step.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => submitAnswer(opt)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-medium glass hover:bg-secondary border border-border/60 hover:border-primary transition-colors"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitAnswer(input);
                }}
                className="flex gap-2"
              >
                <input
                  autoFocus
                  type={step?.type || 'text'}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={step?.placeholder || 'Type your answer…'}
                  className="flex-1 bg-input/60 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="bg-gradient-primary text-primary-foreground hover:opacity-90 px-4 py-2 rounded-xl text-sm font-medium transition-opacity disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            )}

            {stepIdx > 0 && (
              <button
                onClick={goBack}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
              >
                <ArrowLeft className="h-3 w-3" /> Back to previous question
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
