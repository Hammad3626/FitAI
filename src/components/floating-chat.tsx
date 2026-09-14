import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { chatWithCoach } from "@/lib/chat.functions";
import { Button } from "@/components/ui/button";
import { useFitnessContext } from "@/hooks/use-fitness-context";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Build me a custom routine",
  "Workout for today based on my goal",
  "Best diet for weight loss?",
];

export function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hey 👋 I'm your AI fitness coach. Ask me about workouts, nutrition, or recovery — anything to help you move better.",
    },
  ]);
  const send = useServerFn(chatWithCoach);
  const fitnessContext = useFitnessContext();
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
      setMessages([
        ...next,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary shadow-glow animate-pulse-glow hover:scale-110 transition-transform"
        aria-label="Open AI coach"
      >
        {open ? <X className="h-6 w-6 text-primary-foreground" /> : <MessageCircle className="h-6 w-6 text-primary-foreground" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] sm:w-[400px] h-[560px] glass-strong rounded-2xl shadow-elegant flex flex-col overflow-hidden animate-fade-up">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold">FitAI Coach</p>
              <p className="text-xs text-muted-foreground">Online · Powered by Lovable AI</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                {m.role === "assistant" ? (
                  <div className="max-w-[90%] text-sm leading-relaxed text-foreground prose prose-invert prose-sm prose-p:my-2 prose-ul:my-2 prose-headings:mt-3 prose-headings:mb-1 prose-table:text-xs max-w-none">
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
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              size="icon"
              className="bg-gradient-primary text-primary-foreground hover:opacity-90 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
