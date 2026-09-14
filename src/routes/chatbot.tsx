import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send, Sparkles, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { chatWithCoach } from "@/lib/chat.functions";
import { useFitnessContext } from "@/hooks/use-fitness-context";

export const Route = createFileRoute("/chatbot")({
  head: () => ({
    meta: [
      { title: "AI Coach — FitAI" },
      { name: "description", content: "Chat with the FitAI coach for personalized fitness, nutrition, and recovery guidance." },
    ],
  }),
  component: ChatbotPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const PROMPTS = [
  "Workout plan for beginners",
  "Best diet for weight loss?",
  "How much protein should I eat?",
  "How to recover faster after training?",
  "What's a good warm-up routine?",
];

function ChatbotPage() {
  const send = useServerFn(chatWithCoach);
  const fitnessContext = useFitnessContext();
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: "Hi, I'm FitAI 👋 — your personal AI fitness coach. Ask me anything about workouts, nutrition, recovery, or building a routine that sticks.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    } catch (e) {
      console.error(e);
      setMessages([...next, { role: "assistant", content: "Network error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
      <header className="text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-medium text-muted-foreground mb-4">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Live AI Coach
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold">
          Talk to your <span className="gradient-text">AI Coach</span>
        </h1>
        <p className="mt-3 text-muted-foreground">Personalized, evidence-based fitness guidance — anytime.</p>
      </header>

      <div className="glass-strong rounded-3xl flex flex-col h-[70vh] overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 space-y-5">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start gap-3"}>
              {m.role === "assistant" && (
                <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              {m.role === "assistant" ? (
                <div className="max-w-[85%] text-sm sm:text-base leading-relaxed whitespace-pre-wrap">{m.content}</div>
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
                <span className="typing-dot h-2 w-2 rounded-full bg-primary" style={{ animationDelay: "0s" }} />
                <span className="typing-dot h-2 w-2 rounded-full bg-primary" style={{ animationDelay: "0.15s" }} />
                <span className="typing-dot h-2 w-2 rounded-full bg-primary" style={{ animationDelay: "0.3s" }} />
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
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
          className="border-t border-border/40 p-4 flex gap-2"
        >
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything fitness…"
            className="flex-1 bg-input/60 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
          />
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-gradient-primary text-primary-foreground hover:opacity-90 px-5"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
