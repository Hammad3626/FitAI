import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  Brain,
  Dumbbell,
  Flame,
  HeartPulse,
  Quote,
  Sparkles,
  Star,
  Zap,
  ChevronDown,
} from 'lucide-react';
import { dailyTips, faqs } from '../data/fitnessData';
import heroImg from '../assets/hero-athlete.jpg';

const features = [
  {
    icon: Brain,
    title: 'AI Coach',
    desc: 'Conversational guidance trained for fitness, nutrition, and recovery.',
  },
  {
    icon: Dumbbell,
    title: 'Smart Routines',
    desc: 'Workouts adapted to your goal — fat loss, muscle, endurance.',
  },
  {
    icon: HeartPulse,
    title: 'Daily Tips',
    desc: 'Hydration, sleep, and motivation reminders that actually stick.',
  },
  {
    icon: Zap,
    title: 'Progress Tracker',
    desc: 'Visualize streaks, saved routines and goals on your dashboard.',
  },
];

const testimonials = [
  {
    name: 'Aarav S.',
    role: 'Lost 12kg',
    body: 'The AI coach finally made nutrition click. I stopped guessing and started losing fat consistently.',
  },
  {
    name: 'Priya K.',
    role: 'Built strength',
    body: 'Beginner-friendly routines that actually scale up. The chatbot answers questions instantly.',
  },
  {
    name: 'Daniel T.',
    role: 'Marathon runner',
    body: 'Hydration and recovery tips changed my long-run game. Clean UI, zero fluff.',
  },
];

export function Home() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 grid-bg opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-24 lg:pt-24 lg:pb-32 grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Powered by FitAI Guidance
            </div>
            <h1 className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight">
              Your <span className="gradient-text">AI fitness coach</span>,<br />
              available 24/7.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Personalized workouts, smart nutrition, and a conversational AI that
              answers any fitness question — instantly. Train smarter, not harder.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/workouts"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:opacity-90 shadow-glow transition-opacity"
              >
                Start Fitness Journey <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                to="/chatbot"
                className="inline-flex items-center justify-center rounded-xl glass border border-border/60 px-6 py-3 text-base font-semibold hover:bg-secondary transition-colors"
              >
                <Bot className="mr-2 h-4 w-4" /> Ask AI Coach
              </Link>
            </div>

            <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
              <div>
                <span className="text-foreground font-semibold">10k+</span> routines run
              </div>
              <div className="h-4 w-px bg-border" />
              <div>
                <span className="text-foreground font-semibold">4.9★</span> avg rating
              </div>
              <div className="h-4 w-px bg-border" />
              <div>
                <span className="text-foreground font-semibold">24/7</span> AI support
              </div>
            </div>
          </div>

          <div className="relative animate-float">
            <div
              className="absolute -inset-6 bg-gradient-primary opacity-30 blur-3xl rounded-full"
              aria-hidden
            />
            <img
              src={heroImg}
              alt="Athlete in motion with AI energy lines"
              width={1536}
              height={1536}
              className="relative rounded-3xl shadow-elegant border border-border/40 w-full object-cover max-h-[520px]"
            />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl font-bold">
            Everything you need to <span className="gradient-text">level up</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            One platform for training, nutrition, and AI-powered guidance.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="glass-strong rounded-2xl p-6 hover:shadow-glow transition-all hover:-translate-y-1 animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
                <f.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Daily Tips */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="glass-strong rounded-3xl p-8 lg:p-12">
          <div className="flex items-center gap-3 mb-8">
            <Flame className="h-6 w-6 text-primary" />
            <h2 className="font-display text-2xl sm:text-3xl font-bold">Daily fitness tips</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dailyTips.slice(0, 6).map((t, i) => (
              <div
                key={i}
                className="glass rounded-xl p-5 flex items-start gap-3 hover:bg-secondary/40 transition-colors"
              >
                <span className="text-2xl" aria-hidden>
                  {t.icon}
                </span>
                <p className="text-sm leading-relaxed">{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl font-bold">Loved by people in motion</h2>
          <p className="mt-4 text-muted-foreground">Real stories from FitAI users.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="glass-strong rounded-2xl p-6 flex flex-col">
              <Quote className="h-6 w-6 text-primary mb-3" />
              <p className="text-sm leading-relaxed flex-1">{t.body}</p>
              <div className="mt-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
                <div className="flex gap-0.5 text-primary">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl sm:text-4xl font-bold">Frequently asked</h2>
          <p className="mt-3 text-muted-foreground">Quick answers to common fitness questions.</p>
        </div>
        <div className="glass-strong rounded-2xl px-6 divide-y divide-border/40">
          {faqs.map((f, i) => (
            <div key={i} className="py-4">
              <button
                onClick={() => toggleFaq(i)}
                className="w-full flex items-center justify-between text-left font-display font-medium text-foreground hover:text-primary transition-colors py-2"
              >
                <span>{f.q}</span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                    openFaq === i ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openFaq === i && (
                <div className="pt-2 pb-3 text-sm text-muted-foreground leading-relaxed animate-fade-up">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-10 lg:p-16 text-center shadow-glow">
          <div className="absolute inset-0 grid-bg opacity-20" aria-hidden />
          <div className="relative">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary-foreground">
              Ready to train with AI on your side?
            </h2>
            <p className="mt-4 text-primary-foreground/85 max-w-xl mx-auto">
              Start a routine, log your progress, or just ask the coach a question.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/dashboard"
                className="bg-secondary text-foreground hover:bg-secondary/90 px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                Open Dashboard
              </Link>
              <Link
                to="/chatbot"
                className="border border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                Talk to AI Coach
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
