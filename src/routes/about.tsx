import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Send, Target, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — FitAI" },
      { name: "description", content: "About FitAI: mission and how to get in touch." },
    ],
  }),
  component: AboutPage,
});

const values = [
  { icon: Target, title: "Evidence-based", desc: "Guidance grounded in proven training & nutrition science." },
  { icon: Zap, title: "Always available", desc: "An AI coach in your pocket — no scheduling, no excuses." },
  { icon: Users, title: "For everyone", desc: "From day-one beginners to advanced lifters." },
];

function AboutPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    toast.success("Message received! We'll be in touch.");
    setForm({ name: "", email: "", message: "" });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <header className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="font-display text-4xl sm:text-5xl font-bold">
          About <span className="gradient-text">FitAI</span>
        </h1>
        <p className="mt-5 text-lg text-muted-foreground">
          FitAI demonstrates how conversational AI can deliver personalized fitness guidance —
          workouts, nutrition, and motivation — to anyone, anywhere.
        </p>
      </header>

      <section className="glass-strong rounded-3xl p-8 lg:p-12 mb-16 text-center max-w-3xl mx-auto">
        <p className="text-xs uppercase tracking-wider text-primary font-semibold">Our mission</p>
        <h2 className="mt-3 font-display text-2xl sm:text-3xl font-bold leading-snug">
          Make expert fitness coaching accessible to everyone, instantly.
        </h2>
      </section>

      <section className="grid sm:grid-cols-3 gap-6 mb-16">
        {values.map((v, i) => (
          <div key={v.title} className="glass-strong rounded-2xl p-6 text-center animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
              <v.icon className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">{v.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
          </div>
        ))}
      </section>

      <section className="grid lg:grid-cols-2 gap-8">
        <div className="glass-strong rounded-3xl p-8">
          <h2 className="font-display text-2xl font-bold mb-3">Get in touch</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Questions, feedback, or collaboration ideas? Drop us a message.
          </p>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-primary" /> fitai@gmail.com</div>
          </div>
        </div>

        <form onSubmit={submit} className="glass-strong rounded-3xl p-8 space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full bg-input/60 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full bg-input/60 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Message</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={4}
              className="mt-1 w-full bg-input/60 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-ring resize-none"
              placeholder="Tell us anything…"
            />
          </div>
          <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90">
            <Send className="mr-2 h-4 w-4" /> Send Message
          </Button>
        </form>
      </section>
    </div>
  );
}
