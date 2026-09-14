import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, X, Bot, User as UserIcon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export type RoutineAnswers = {
  goal: string;
  level: string;
  gender: string;
  age: string;
  height: string;
  weight: string;
  daysPerWeek: string;
  timeMin: string;
  location: string;
  equipment: string;
  injuries: string;
  style: string;
  targetAreas: string;
};

type Step = {
  key: keyof RoutineAnswers;
  question: string;
  options?: string[];
  placeholder?: string;
  type?: "text" | "number";
  optional?: boolean;
};

const STEPS: Step[] = [
  { key: "goal", question: "What's your main fitness goal?", options: ["Weight Loss", "Muscle Gain", "Strength", "Endurance", "General Fitness"] },
  { key: "level", question: "What's your experience level?", options: ["Beginner", "Intermediate", "Advanced"] },
  { key: "gender", question: "What's your gender?", options: ["Male", "Female", "Other / Prefer not to say"] },
  { key: "age", question: "How old are you?", placeholder: "e.g. 27", type: "number" },
  { key: "height", question: "What's your height?", placeholder: "e.g. 175 cm or 5'9\"" },
  { key: "weight", question: "What's your current weight?", placeholder: "e.g. 72 kg or 160 lbs" },
  { key: "daysPerWeek", question: "How many days per week can you train?", options: ["2", "3", "4", "5", "6"] },
  { key: "timeMin", question: "How long per session (minutes)?", options: ["20", "30", "45", "60", "75", "90"] },
  { key: "location", question: "Where will you work out?", options: ["Home", "Gym", "Both"] },
  { key: "equipment", question: "What equipment do you have?", placeholder: "dumbbells, bands, bodyweight only…", optional: true },
  { key: "injuries", question: "Any injuries or limitations? (type 'none' if not)", placeholder: "e.g. left knee, lower back" },
  { key: "style", question: "Preferred workout style?", options: ["Cardio", "Strength", "HIIT", "Yoga", "Mixed"] },
  { key: "targetAreas", question: "Target body areas?", options: ["Full Body", "Upper Body", "Lower Body", "Chest", "Back", "Arms", "Legs", "Core", "Glutes"] },
];

type Msg = { role: "bot" | "user"; text: string };

export function RoutineBuilderChat({
  open,
  onClose,
  onComplete,
  generating,
}: {
  open: boolean;
  onClose: () => void;
  onComplete: (a: RoutineAnswers) => void;
  generating: boolean;
}) {
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<Partial<RoutineAnswers>>({});
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      setStepIdx(0);
      setAnswers({});
      setMessages([
        { role: "bot", text: "Hey! I'm your AI fitness coach. Answer a few quick questions and I'll build a routine made just for you." },
        { role: "bot", text: STEPS[0].question },
      ]);
      setInput("");
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, generating]);

  if (!open) return null;

  const step = STEPS[stepIdx];
  const isDone = stepIdx >= STEPS.length;

  function submit(value: string) {
    const v = value.trim();
    if (!v) return;
    const newAnswers = { ...answers, [step.key]: v };
    setAnswers(newAnswers);
    const nextIdx = stepIdx + 1;
    const nextMessages: Msg[] = [...messages, { role: "user", text: v }];
    if (nextIdx < STEPS.length) {
      nextMessages.push({ role: "bot", text: STEPS[nextIdx].question });
    } else {
      nextMessages.push({ role: "bot", text: "Got it! Building your personalized routine now…" });
    }
    setMessages(nextMessages);
    setInput("");
    setStepIdx(nextIdx);
    if (nextIdx >= STEPS.length) {
      onComplete(newAnswers as RoutineAnswers);
    }
  }

  function goBack() {
    if (stepIdx === 0) return;
    const prevIdx = stepIdx - 1;
    setStepIdx(prevIdx);
    // Trim last bot question + last user answer
    setMessages((m) => {
      const trimmed = [...m];
      // Remove trailing bot question
      while (trimmed.length && trimmed[trimmed.length - 1].role === "bot") trimmed.pop();
      // Remove the last user answer
      if (trimmed.length && trimmed[trimmed.length - 1].role === "user") trimmed.pop();
      trimmed.push({ role: "bot", text: STEPS[prevIdx].question });
      return trimmed;
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-up" onClick={() => !generating && onClose()}>
      <div className="glass-strong rounded-2xl max-w-xl w-full max-h-[88vh] flex flex-col shadow-elegant" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-5 border-b border-border/40 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-lg font-bold leading-tight">AI Routine Coach</h3>
            <div className="mt-1 h-1 bg-secondary/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-primary transition-all"
                style={{ width: `${Math.min(100, (stepIdx / STEPS.length) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {isDone ? "All set" : `Question ${stepIdx + 1} of ${STEPS.length}`}
            </p>
          </div>
          <button onClick={onClose} disabled={generating} className="text-muted-foreground hover:text-foreground disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "bot" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-primary mt-0.5">
                  <Bot className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
              )}
              <div className={`rounded-2xl px-3.5 py-2 text-sm max-w-[80%] ${
                m.role === "user"
                  ? "bg-gradient-primary text-primary-foreground rounded-br-sm"
                  : "glass border border-border/40 rounded-bl-sm"
              }`}>
                {m.text}
              </div>
              {m.role === "user" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary mt-0.5">
                  <UserIcon className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          ))}
          {generating && (
            <div className="flex gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-primary mt-0.5">
                <Bot className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <div className="glass rounded-2xl rounded-bl-sm px-4 py-3 border border-border/40">
                <div className="flex gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        {!isDone && !generating && (
          <div className="p-4 border-t border-border/40 space-y-3">
            {step.options && (
              <div className="flex flex-wrap gap-1.5">
                {step.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => submit(opt)}
                    className="px-3 py-1.5 rounded-full text-xs glass border border-border/60 hover:bg-gradient-primary hover:text-primary-foreground hover:border-transparent transition-all"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
            <form
              onSubmit={(e) => { e.preventDefault(); submit(input); }}
              className="flex gap-2 items-center"
            >
              {stepIdx > 0 && (
                <button type="button" onClick={goBack} className="text-muted-foreground hover:text-foreground p-2" aria-label="Back">
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <input
                type={step.type === "number" ? "number" : "text"}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={step.placeholder ?? "Type your answer or pick an option…"}
                className="flex-1 bg-input/60 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
              <Button type="submit" size="sm" disabled={!input.trim()} className="bg-gradient-primary text-primary-foreground">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
