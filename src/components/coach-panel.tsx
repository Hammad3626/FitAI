import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send, Sparkles, Sliders, RefreshCw, Wand2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { chatWithCoach } from "@/lib/chat.functions";
import { useFitnessContext, type FitnessContext } from "@/hooks/use-fitness-context";

type Msg = { role: "user" | "assistant"; content: string };

const QUICK_ACTIONS = [
  { label: "Build custom routine", prompt: "Create a custom workout routine for me. Ask me what you need to know (equipment, days/week, time per session, injuries, focus) and then build a fully personalized plan with warm-up, main sets table, and cool-down." },
  { label: "Plan my week", prompt: "Build me a custom weekly workout schedule (Mon–Sun table) that matches my goal and weekly target. Use my saved routines if relevant." },
  { label: "Today's workout", prompt: "Give me ONE custom workout for today based on my goal and weekly progress. Use the structured routine format." },
  { label: "Adapt to today", prompt: "I want to train but adapt to how I feel right now. Ask about my energy, soreness, time available and equipment, then give me a fitting routine." },
  { label: "Diet for my goal", prompt: "Build a custom one-day meal plan with macros for my goal. Ask about restrictions or calorie target if needed." },
];

function greeting(ctx: FitnessContext | undefined) {
  if (!ctx) return "Hey! Ask me anything about your training or nutrition.";
  const name = ctx.displayName ? `, ${ctx.displayName}` : "";
  const goal = ctx.goal ? ` I see your goal is "${ctx.goal}".` : "";
  return `Hey${name} 👋${goal} Ask me for a workout, a meal idea, or use a quick action below.`;
}

export function CoachPanel() {
  const send = useServerFn(chatWithCoach);
  const fitnessContext = useFitnessContext();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Routine constraints — used to regenerate the last routine on demand
  const [showConstraints, setShowConstraints] = useState(false);
  const [equipment, setEquipment] = useState("");
  const [timeMin, setTimeMin] = useState(30);
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [level, setLevel] = useState<"Beginner" | "Intermediate" | "Advanced">("Beginner");
  const [intensity, setIntensity] = useState<"Easy" | "Moderate" | "Hard">("Moderate");
  const [style, setStyle] = useState("");
  const [injuries, setInjuries] = useState("");
  const [focus, setFocus] = useState("");
  const [energy, setEnergy] = useState(7);

  useEffect(() => {
    setMessages([{ role: "assistant", content: greeting(fitnessContext) }]);
  }, [fitnessContext?.displayName, fitnessContext?.goal]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await send({ data: { messages: next, fitnessContext } });
      setMessages([...next, { role: "assistant", content: res.reply }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  const hasRoutine = messages.some(
    (m) => m.role === "assistant" && /###\s|Main sets|Warm-up/i.test(m.content),
  );

  function buildConstraintsLine() {
    const parts: string[] = [];
    parts.push(`Level: ${level}`);
    parts.push(`Time available: ${timeMin} min`);
    parts.push(`Days/week: ${daysPerWeek}`);
    parts.push(`Intensity: ${intensity}`);
    parts.push(`Energy today: ${energy}/10`);
    if (equipment.trim()) parts.push(`Equipment: ${equipment.trim()}`);
    if (style.trim()) parts.push(`Style: ${style.trim()}`);
    if (focus.trim()) parts.push(`Focus: ${focus.trim()}`);
    if (injuries.trim()) parts.push(`Injuries / limitations: ${injuries.trim()}`);
    return parts.join(" · ");
  }

  function handleRegenerate() {
    const line = buildConstraintsLine();
    const verb = hasRoutine ? "Regenerate the last routine" : "Build me a routine";
    handleSend(
      `${verb} adapted to my current situation — ${line}. Use the structured routine format (### title, warm-up, main sets table, cool-down, coach notes). Keep it scannable.`,
    );
  }

  function handleApplyToNew() {
    const line = buildConstraintsLine();
    handleSend(
      `Build me a brand new routine that fits these constraints: ${line}. Use the structured routine format. Do not reuse my previous routine.`,
    );
  }

  return (
    <div className="glass-strong rounded-2xl p-6 flex flex-col h-[560px]">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold">AI Coach Assistant</h2>
          <p className="text-xs text-muted-foreground">Personalized to your goal & saved routines</p>
        </div>
      </div>

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

      <div className="mb-3">
        <button
          type="button"
          onClick={() => setShowConstraints((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Sliders className="h-3 w-3" />
          {showConstraints ? "Hide" : "Tweak"} routine controls
        </button>
        {showConstraints && (
          <div className="mt-2 glass rounded-xl p-3 space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <Mini label="Level">
                <select value={level} onChange={(e) => setLevel(e.target.value as typeof level)} className={miniInput}>
                  <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                </select>
              </Mini>
              <Mini label="Intensity">
                <select value={intensity} onChange={(e) => setIntensity(e.target.value as typeof intensity)} className={miniInput}>
                  <option>Easy</option><option>Moderate</option><option>Hard</option>
                </select>
              </Mini>
              <Mini label={`Time: ${timeMin}m`}>
                <input type="range" min={10} max={120} step={5} value={timeMin} onChange={(e) => setTimeMin(+e.target.value)} className="w-full accent-primary" />
              </Mini>
              <Mini label={`Days/wk: ${daysPerWeek}`}>
                <input type="range" min={1} max={7} value={daysPerWeek} onChange={(e) => setDaysPerWeek(+e.target.value)} className="w-full accent-primary" />
              </Mini>
              <Mini label={`Energy: ${energy}/10`} className="col-span-2">
                <input type="range" min={1} max={10} value={energy} onChange={(e) => setEnergy(+e.target.value)} className="w-full accent-primary" />
              </Mini>
              <input value={equipment} onChange={(e) => setEquipment(e.target.value)} placeholder="Equipment (dumbbells, bands…)" maxLength={120} className={miniInput} />
              <input value={style} onChange={(e) => setStyle(e.target.value)} placeholder="Style (HIIT, strength…)" maxLength={80} className={miniInput} />
              <input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="Focus (upper body…)" maxLength={120} className={miniInput} />
              <input value={injuries} onChange={(e) => setInjuries(e.target.value)} placeholder="Injuries / limits" maxLength={160} className={miniInput} />
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                disabled={loading}
                onClick={handleRegenerate}
                className="bg-gradient-primary text-primary-foreground h-8 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                {hasRoutine ? "Regenerate routine" : "Build with these"}
              </Button>
              {hasRoutine && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={loading}
                  onClick={handleApplyToNew}
                  className="h-8 text-xs"
                >
                  Build brand new
                </Button>
              )}
              <button
                type="button"
                onClick={() => { setEquipment(""); setTimeMin(30); setDaysPerWeek(3); setLevel("Beginner"); setIntensity("Moderate"); setStyle(""); setInjuries(""); setFocus(""); setEnergy(7); }}
                className="text-xs text-muted-foreground hover:text-foreground self-center"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto pr-1 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            {m.role === "assistant" ? (
              <div className="max-w-[90%] text-sm leading-relaxed text-foreground prose prose-invert prose-sm prose-p:my-2 prose-ul:my-2 prose-headings:mt-3 prose-headings:mb-1 max-w-none">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            ) : (
              <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-gradient-primary text-primary-foreground px-3.5 py-2 text-sm">
                {m.content}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="typing-dot h-2 w-2 rounded-full bg-primary" style={{ animationDelay: "0s" }} />
            <span className="typing-dot h-2 w-2 rounded-full bg-primary" style={{ animationDelay: "0.15s" }} />
            <span className="typing-dot h-2 w-2 rounded-full bg-primary" style={{ animationDelay: "0.3s" }} />
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
        className="mt-3 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the coach about your plan…"
          className="flex-1 bg-input/60 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <Button type="submit" disabled={loading || !input.trim()} size="icon" className="bg-gradient-primary text-primary-foreground shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

const miniInput = "bg-input/60 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring";

function Mini({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">{label}</span>
      {children}
    </label>
  );
}
