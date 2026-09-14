import { useEffect, useMemo, useState } from "react";
import {
  X, Play, Download, RefreshCw, Share2, Bookmark, Sparkles, Flame,
  Clock, Dumbbell, Target, Zap, Heart, Activity, ChevronDown, ChevronUp,
  CheckCircle2, Circle, Timer, TrendingUp, Droplets, Brain, Award, CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import ReactMarkdown from "react-markdown";

export type CustomRoutineLike = {
  id: string;
  title: string;
  goal: string | null;
  level: string | null;
  equipment: string | null;
  days_per_week: number | null;
  time_min: number | null;
  focus: string | null;
  injuries: string | null;
  intensity: string | null;
  content: string;
  created_at: string;
};

type Exercise = {
  name: string;
  sets?: string;
  reps?: string;
  rest?: string;
  detail?: string;
};

type Parsed = {
  title: string;
  metaPairs: { label: string; value: string }[];
  warmUp: Exercise[];
  warmUpDuration?: string;
  main: Exercise[];
  coolDown: Exercise[];
  coolDownDuration?: string;
  coachNotes?: string;
};

function parseRoutine(md: string): Parsed {
  const lines = md.split(/\r?\n/);
  let title = "Custom Routine";
  const metaPairs: { label: string; value: string }[] = [];
  const warmUp: Exercise[] = [];
  const main: Exercise[] = [];
  const coolDown: Exercise[] = [];
  let warmUpDuration: string | undefined;
  let coolDownDuration: string | undefined;
  let coachNotes: string | undefined;

  let section: "none" | "warm" | "main" | "cool" | "notes" = "none";
  let inTable = false;
  let tableHeader: string[] = [];

  for (let raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const titleMatch = line.match(/^###\s+(.+)$/);
    if (titleMatch) { title = titleMatch[1].trim(); continue; }

    // Meta line: **Goal:** ... · **Level:** ... etc on a single line
    if (line.startsWith("**") && /\*\*[^*]+:\*\*/.test(line) && section === "none") {
      const re = /\*\*([^*]+?):\*\*\s*([^·•|]+?)(?=\s*[·•|]|\s*\*\*|$)/g;
      let m;
      while ((m = re.exec(line)) !== null) {
        metaPairs.push({ label: m[1].trim(), value: m[2].trim() });
      }
      continue;
    }

    // Section headers
    const warmMatch = line.match(/^\*\*Warm[- ]?up(?:\s*\(([^)]+)\))?\*\*/i);
    if (warmMatch) { section = "warm"; warmUpDuration = warmMatch[1]; inTable = false; continue; }
    if (/^\*\*Main(?:\s+sets?| workout)?\*\*/i.test(line)) { section = "main"; inTable = false; continue; }
    const coolMatch = line.match(/^\*\*Cool[- ]?down(?:\s*\(([^)]+)\))?\*\*/i);
    if (coolMatch) { section = "cool"; coolDownDuration = coolMatch[1]; inTable = false; continue; }
    if (/^\*\*Coach notes?:?\*\*/i.test(line)) {
      section = "notes";
      coachNotes = line.replace(/^\*\*Coach notes?:?\*\*/i, "").trim();
      continue;
    }

    if (section === "notes") {
      coachNotes = (coachNotes ? coachNotes + " " : "") + line.replace(/\*\*/g, "");
      continue;
    }

    // Table parsing for main sets
    if (line.startsWith("|")) {
      const cells = line.split("|").map((c) => c.trim()).filter((c) => c.length > 0);
      if (/^\|?\s*:?-+:?/.test(line)) { inTable = true; continue; }
      if (!inTable && tableHeader.length === 0) {
        tableHeader = cells.map((c) => c.toLowerCase());
        continue;
      }
      if (inTable && cells.length >= 2 && section === "main") {
        const get = (key: string) => {
          const idx = tableHeader.findIndex((h) => h.includes(key));
          return idx >= 0 ? cells[idx] : undefined;
        };
        main.push({
          name: get("exercise") || cells[0],
          sets: get("set"),
          reps: get("rep") || get("time") || get("duration"),
          rest: get("rest"),
        });
        continue;
      }
    } else {
      inTable = false;
      if (line.startsWith("|") === false && tableHeader.length && !line.startsWith("-")) {
        tableHeader = [];
      }
    }

    // Bullet exercises
    const bulletMatch = line.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      const body = bulletMatch[1].replace(/\*\*/g, "");
      const sep = body.match(/^(.+?)\s+[—–-]\s+(.+)$/);
      const ex: Exercise = sep
        ? { name: sep[1].trim(), detail: sep[2].trim() }
        : { name: body.trim() };
      if (section === "warm") warmUp.push(ex);
      else if (section === "cool") coolDown.push(ex);
      else if (section === "main") main.push(ex);
    }
  }

  return { title, metaPairs, warmUp, warmUpDuration, main, coolDown, coolDownDuration, coachNotes };
}

const muscleHints: { key: RegExp; label: string }[] = [
  { key: /squat|lunge|leg|glute|deadlift|hip|calf/i, label: "Legs" },
  { key: /press|push[- ]?up|chest|bench|fly/i, label: "Chest" },
  { key: /row|pull[- ]?up|lat|back/i, label: "Back" },
  { key: /curl|bicep|tricep|dip|arm/i, label: "Arms" },
  { key: /plank|crunch|ab|core|sit[- ]?up|russian/i, label: "Core" },
  { key: /shoulder|raise|overhead|ohp/i, label: "Shoulders" },
  { key: /run|sprint|burpee|jump|jog|cardio|hiit|mountain/i, label: "Cardio" },
];

function muscleFor(name: string) {
  for (const m of muscleHints) if (m.key.test(name)) return m.label;
  return "Full Body";
}

const muscleColor: Record<string, string> = {
  Legs: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Chest: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  Back: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  Arms: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Core: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
  Shoulders: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  Cardio: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  "Full Body": "bg-primary/15 text-primary border-primary/30",
};

function metaFromRoutine(routine: CustomRoutineLike) {
  return {
    goal: routine.goal || "General Fitness",
    level: routine.level || "Beginner",
    duration: routine.time_min ? `${routine.time_min} min` : "30 min",
    frequency: routine.days_per_week ? `${routine.days_per_week}× / week` : "3× / week",
    intensity: routine.intensity || "Moderate",
    focus: routine.focus || "Full Body",
  };
}

function estimateCalories(routine: CustomRoutineLike) {
  const min = routine.time_min ?? 30;
  const intensityMul =
    routine.intensity === "Hard" ? 9.5 : routine.intensity === "Easy" ? 4.5 : 7;
  return Math.round(min * intensityMul);
}

const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export type CycleDay = {
  day: number;
  title: string;
  completed: boolean;
  isCurrent: boolean;
};

export function RoutineDetail({
  routine,
  onClose,
  onRegenerate,
  onDownload,
  onSave,
  onCompleteDay,
  onResetCycle,
  onJumpToDay,
  onExerciseProgress,
  generating,
  saved,
  dayNumber = 1,
  totalDays,
  cycleDays = [],
  initialCompletedExercises = [],
}: {
  routine: CustomRoutineLike;
  onClose: () => void;
  onRegenerate: () => void;
  onDownload: () => void;
  onSave?: () => void;
  onCompleteDay?: (day: number) => void;
  onResetCycle?: () => void;
  onJumpToDay?: (day: number) => void;
  onExerciseProgress?: (completedIds: string[]) => void;
  generating?: boolean;
  saved?: boolean;
  dayNumber?: number;
  totalDays?: number;
  cycleDays?: CycleDay[];
  initialCompletedExercises?: string[];
}) {
  const parsed = useMemo(() => parseRoutine(routine.content), [routine.content]);
  const meta = metaFromRoutine(routine);
  const calories = estimateCalories(routine);
  const totalExercises = parsed.warmUp.length + parsed.main.length + parsed.coolDown.length;

  const [completed, setCompleted] = useState<Set<string>>(() => new Set(initialCompletedExercises));
  const [active, setActive] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState({ warm: true, main: true, cool: true });
  const [confirmReset, setConfirmReset] = useState(false);

  // Reset completion state when switching routines (jump to another day)
  useEffect(() => {
    setCompleted(new Set(initialCompletedExercises));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routine.id]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function toggle(id: string) {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      onExerciseProgress?.(Array.from(next));
      return next;
    });
  }

  const completedCount = completed.size;
  const progressPct = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0;

  const trainingDays = routine.days_per_week ?? 3;
  const schedule = useMemo(() => {
    // Distribute training days across the week
    const idxs = new Set<number>();
    const step = Math.max(1, Math.floor(7 / trainingDays));
    for (let i = 0, count = 0; i < 7 && count < trainingDays; i += step, count++) idxs.add(i);
    return dayNames.map((d, i) => ({ day: d, training: idxs.has(i) }));
  }, [trainingDays]);

  const sectionMeta: { key: "warm" | "main" | "cool"; title: string; icon: typeof Flame; color: string; items: Exercise[]; duration?: string }[] = [
    { key: "warm", title: "Warm-up", icon: Flame, color: "from-amber-500 to-orange-600", items: parsed.warmUp, duration: parsed.warmUpDuration || "5 min" },
    { key: "main", title: "Main Workout", icon: Dumbbell, color: "from-primary to-purple-500", items: parsed.main, duration: routine.time_min ? `${Math.max(10, routine.time_min - 10)} min` : undefined },
    { key: "cool", title: "Cool-down", icon: Heart, color: "from-emerald-500 to-teal-500", items: parsed.coolDown, duration: parsed.coolDownDuration || "5 min" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md overflow-y-auto animate-fade-in">
      {/* Animated glow background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/20 blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-purple-500/20 blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }} />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-fuchsia-500/15 blur-3xl animate-pulse" style={{ animationDelay: "3s" }} />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-32">
        {/* Close */}
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="glass border-primary/40 text-primary text-[10px] uppercase tracking-widest gap-1.5">
              <Sparkles className="h-3 w-3" /> AI Generated
            </Badge>
            <Badge variant="outline" className="glass border-emerald-500/40 text-emerald-300 text-[10px] uppercase tracking-widest">
              Day {dayNumber}{totalDays ? ` / ${totalDays}` : ""}
            </Badge>
          </div>
          <button onClick={onClose} className="rounded-full p-2 glass hover:bg-secondary/60 transition-colors" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* HERO */}
        <section className="relative overflow-hidden rounded-3xl glass-strong p-6 sm:p-10 shadow-elegant">
          <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10" />
          <div aria-hidden className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-gradient-primary opacity-20 blur-3xl" />

          <div className="relative">
            <h1 className="font-display text-3xl sm:text-5xl font-bold leading-tight">
              <span className="gradient-text drop-shadow-[0_0_30px_oklch(0.7_0.22_280/0.4)]">{parsed.title || routine.title}</span>
            </h1>
            <p className="mt-3 text-sm text-muted-foreground max-w-xl">
              Adaptive intensity · Recovery balanced · Tailored to your profile
            </p>

            {/* Summary chips */}
            <div className="mt-6 flex flex-wrap gap-2">
              <Chip icon={Target} label="Goal" value={meta.goal} />
              <Chip icon={TrendingUp} label="Level" value={meta.level} />
              <Chip icon={Clock} label="Duration" value={meta.duration} />
              <Chip icon={CalendarDays} label="Frequency" value={meta.frequency} />
              <Chip icon={Zap} label="Intensity" value={meta.intensity} />
            </div>

            {/* Stat cards */}
            <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard icon={Flame} label="Est. burn" value={`${calories}`} unit="kcal" tone="orange" />
              <StatCard icon={Dumbbell} label="Exercises" value={`${totalExercises}`} unit="moves" tone="primary" />
              <StatCard icon={Timer} label="Session" value={`${routine.time_min ?? 30}`} unit="minutes" tone="emerald" />
              <StatCard icon={Activity} label="Recovery" value="24" unit="hours" tone="violet" />
            </div>

            {/* Circular progress */}
            <div className="mt-7 flex items-center gap-4 glass rounded-2xl p-4 border border-border/40">
              <CircularProgress value={progressPct} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Workout progress</p>
                <p className="font-display text-xl font-bold">{completedCount} / {totalExercises} <span className="text-muted-foreground text-sm font-normal">complete</span></p>
                <Progress value={progressPct} className="h-1.5 mt-2" />
              </div>
            </div>
          </div>
        </section>

        {/* AI INSIGHT */}
        <InsightCard
          icon={Brain}
          title="AI Coach Insight"
          body={`This routine is optimized for ${meta.goal.toLowerCase()} with ${meta.intensity.toLowerCase()} intensity. Rest 48h before training the same muscle group again.`}
        />

        {/* WEEKLY SPLIT TIMELINE */}
        {cycleDays.length > 0 && (
          <section className="mt-6 glass-strong rounded-2xl p-5 border border-border/40">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                <h3 className="font-display font-semibold">Weekly Split</h3>
                <Badge variant="outline" className="text-[10px]">
                  {cycleDays.filter((d) => d.completed).length} / {totalDays ?? cycleDays.length} done
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Tap a saved day to jump back</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: totalDays ?? cycleDays.length }, (_, i) => i + 1).map((d) => {
                const found = cycleDays.find((c) => c.day === d);
                const isCurrent = found?.isCurrent;
                const isDone = found?.completed;
                const exists = !!found;
                return (
                  <button
                    key={d}
                    disabled={!exists}
                    onClick={() => exists && onJumpToDay?.(d)}
                    className={`relative rounded-xl px-3 py-2 text-xs border transition-all min-w-[68px] text-left ${
                      isCurrent
                        ? "border-primary/60 bg-primary/15 shadow-glow"
                        : isDone
                        ? "border-emerald-500/40 bg-emerald-500/10 hover:-translate-y-0.5"
                        : exists
                        ? "border-border/50 glass hover:border-primary/40 hover:-translate-y-0.5"
                        : "border-border/30 bg-secondary/20 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Day</p>
                    <p className="font-display text-base font-bold leading-none">{d}</p>
                    <div className="mt-1 flex items-center gap-1">
                      {isDone ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      ) : exists ? (
                        <Circle className="h-3 w-3 text-primary" />
                      ) : (
                        <Circle className="h-3 w-3 text-muted-foreground/40" />
                      )}
                      <span className="text-[9px] text-muted-foreground">
                        {isDone ? "Done" : exists ? (isCurrent ? "Now" : "Saved") : "Locked"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* DAY COMPLETE BANNER */}
        {totalExercises > 0 && progressPct === 100 && onCompleteDay && (() => {
          const isWeekDone = !!(totalDays && dayNumber >= totalDays);
          return (
            <>
              <section className={`mt-6 relative overflow-hidden rounded-2xl border p-6 animate-fade-in ${
                isWeekDone
                  ? "border-amber-400/50 bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-rose-500/10"
                  : "border-emerald-500/40 bg-gradient-to-br from-emerald-500/15 via-primary/10 to-purple-500/10"
              }`}>
                <div aria-hidden className={`absolute -top-10 -right-10 h-40 w-40 rounded-full blur-3xl ${isWeekDone ? "bg-amber-400/30" : "bg-emerald-500/30"}`} />
                <div className="relative flex items-start gap-4 flex-wrap">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-glow bg-gradient-to-br ${isWeekDone ? "from-amber-400 to-orange-600" : "from-emerald-400 to-teal-600"}`}>
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-[220px]">
                    <p className={`text-[10px] uppercase tracking-widest font-semibold ${isWeekDone ? "text-amber-300" : "text-emerald-300"}`}>
                      {isWeekDone ? `Week Complete · ${totalDays}/${totalDays} Days` : `Day ${dayNumber} Complete`}
                    </p>
                    <h3 className="font-display text-xl sm:text-2xl font-bold mt-1">
                      {isWeekDone ? "You finished the full week!" : `Crushed it — ${completedCount} exercises done!`}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isWeekDone
                        ? "Take 24–48h of active recovery, then jump back in. Day 1 of the next cycle will be freshly tailored to how your body adapted."
                        : `Save this session and let the AI coach build Day ${dayNumber + 1} tailored to your recovery and target muscles.`}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        onClick={() => isWeekDone ? setConfirmReset(true) : onCompleteDay(dayNumber)}
                        disabled={generating}
                        className="bg-gradient-primary text-primary-foreground shadow-glow"
                      >
                        {generating ? (
                          <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Working…</>
                        ) : isWeekDone ? (
                          <><Sparkles className="h-4 w-4 mr-2" /> Reset & Generate Fresh Day 1</>
                        ) : (
                          <><Sparkles className="h-4 w-4 mr-2" /> Save Day {dayNumber} & Build Day {dayNumber + 1}</>
                        )}
                      </Button>
                      <Button variant="outline" onClick={onClose}>{isWeekDone ? "Rest first" : "Finish later"}</Button>
                    </div>
                  </div>
                </div>
              </section>

              {isWeekDone && (
                <section className="mt-4 grid sm:grid-cols-3 gap-3 animate-fade-in">
                  <RecoveryTip icon={Droplets} title="Hydrate" body="Drink 2.5–3L water over the next 24h to flush metabolic waste." tone="sky" />
                  <RecoveryTip icon={Heart} title="Active Recovery" body="Light walk or yoga 20–30 min. Avoid heavy lifts for at least one day." tone="rose" />
                  <RecoveryTip icon={Brain} title="Sleep & Refuel" body="Aim for 7–9h sleep and a protein-rich meal within 1h post-workout." tone="violet" />
                </section>
              )}
            </>
          );
        })()}

        {/* WORKOUT FLOW TIMELINE */}
        <section className="mt-8 space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-bold">Workout Flow</h2>
            <span className="text-xs text-muted-foreground">Tap an exercise to mark complete</span>
          </div>

          <div className="relative">
            {/* timeline line */}
            <div aria-hidden className="absolute left-5 top-2 bottom-2 w-px bg-gradient-to-b from-amber-500/40 via-primary/40 to-emerald-500/40" />

            {sectionMeta.map((s, sIdx) => {
              const Icon = s.icon;
              const open = openSections[s.key];
              const sectionDone = s.items.every((e, i) => completed.has(`${s.key}-${i}`));
              return (
                <div key={s.key} className="relative pl-12 pb-6">
                  <div className={`absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${s.color} shadow-glow ring-4 ring-background`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>

                  <div className="glass-strong rounded-2xl border border-border/40 overflow-hidden">
                    <button
                      onClick={() => setOpenSections((p) => ({ ...p, [s.key]: !p[s.key] }))}
                      className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div>
                          <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                            {s.title}
                            {sectionDone && s.items.length > 0 && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {s.items.length} exercises{s.duration ? ` · ${s.duration}` : ""}
                          </p>
                        </div>
                      </div>
                      {open ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                    </button>

                    {open && (
                      <div className="p-4 pt-0 space-y-3 animate-fade-in">
                        {s.items.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">No exercises in this section.</p>
                        ) : (
                          s.items.map((ex, i) => {
                            const id = `${s.key}-${i}`;
                            const isDone = completed.has(id);
                            const isActive = active === id;
                            const muscle = muscleFor(ex.name);
                            return (
                              <div
                                key={id}
                                className={`group rounded-xl border p-4 transition-all duration-300 cursor-pointer ${
                                  isDone
                                    ? "border-emerald-500/40 bg-emerald-500/5"
                                    : isActive
                                    ? "border-primary/60 bg-primary/5 shadow-glow"
                                    : "border-border/40 glass hover:border-primary/30 hover:-translate-y-0.5"
                                }`}
                                onClick={() => setActive(id)}
                              >
                                <div className="flex items-start gap-3">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); toggle(id); }}
                                    className="mt-0.5 shrink-0"
                                    aria-label="Toggle complete"
                                  >
                                    {isDone ? (
                                      <CheckCircle2 className="h-6 w-6 text-emerald-400 animate-scale-in" />
                                    ) : (
                                      <Circle className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors" />
                                    )}
                                  </button>

                                  {/* Thumbnail placeholder */}
                                  <div className={`hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} opacity-90`}>
                                    <Dumbbell className="h-6 w-6 text-white/90" />
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <h4 className={`font-semibold leading-tight ${isDone ? "line-through text-muted-foreground" : ""}`}>
                                        {ex.name}
                                      </h4>
                                      <Badge variant="outline" className={`text-[10px] shrink-0 ${muscleColor[muscle]}`}>{muscle}</Badge>
                                    </div>

                                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                                      {ex.sets && <span className="flex items-center gap-1"><Dumbbell className="h-3 w-3" /> <strong className="text-foreground">{ex.sets}</strong> sets</span>}
                                      {ex.reps && <span className="flex items-center gap-1"><Target className="h-3 w-3" /> <strong className="text-foreground">{ex.reps}</strong></span>}
                                      {ex.rest && <span className="flex items-center gap-1"><Timer className="h-3 w-3" /> <strong className="text-foreground">{ex.rest}</strong> rest</span>}
                                      {ex.detail && !ex.sets && !ex.reps && <span className="text-foreground/80">{ex.detail}</span>}
                                    </div>

                                    {isActive && !isDone && (
                                      <Button
                                        size="sm"
                                        onClick={(e) => { e.stopPropagation(); toggle(id); }}
                                        className="mt-3 bg-gradient-primary text-primary-foreground h-8 text-xs"
                                      >
                                        <Play className="h-3 w-3 mr-1" /> Start exercise
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  {/* Inline AI insight between sections */}
                  {sIdx === 0 && parsed.main.length > 0 && (
                    <div className="mt-3 ml-0 flex items-center gap-2 text-xs text-muted-foreground">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      Warm-up raises core temp ~1°C — primes joints for the main lifts.
                    </div>
                  )}
                  {sIdx === 1 && parsed.coolDown.length > 0 && (
                    <div className="mt-3 ml-0 flex items-center gap-2 text-xs text-muted-foreground">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      Stretch within 10 min post-workout to boost recovery by ~20%.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* COACH NOTES */}
        {parsed.coachNotes && (
          <section className="mt-6 glass-strong rounded-2xl p-5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-5 w-5 text-primary" />
              <h3 className="font-display font-semibold">Coach Notes</h3>
            </div>
            <div className="prose prose-invert prose-sm max-w-none text-muted-foreground">
              <ReactMarkdown>{parsed.coachNotes}</ReactMarkdown>
            </div>
          </section>
        )}

        {/* WEEKLY SCHEDULE */}
        <section className="mt-8">
          <h2 className="font-display text-2xl font-bold mb-4">Weekly Schedule</h2>
          <div className="grid grid-cols-7 gap-2">
            {schedule.map((d, i) => (
              <div
                key={d.day}
                className={`rounded-xl p-2 sm:p-3 text-center border transition-all hover:-translate-y-0.5 ${
                  d.training
                    ? "bg-gradient-to-br from-primary/20 to-purple-500/10 border-primary/40 shadow-glow"
                    : "glass border-border/40"
                }`}
              >
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{d.day}</p>
                <div className="mt-2 flex justify-center">
                  {d.training ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary">
                      <Dumbbell className="h-4 w-4 text-primary-foreground" />
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/40">
                      <Heart className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <p className="mt-2 text-[10px] font-semibold">
                  {d.training ? "Train" : "Rest"}
                </p>
                <p className="text-[9px] text-muted-foreground truncate">
                  {d.training ? meta.focus : "Recovery"}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* EXTRA STATS */}
        <section className="mt-8 grid sm:grid-cols-3 gap-3">
          <MiniStat icon={Droplets} label="Hydration" value="2.5L" hint="Daily target" tone="sky" />
          <MiniStat icon={Award} label="Streak" value="3 days" hint="Keep it up" tone="amber" />
          <MiniStat icon={Activity} label="Energy" value="High" hint="Optimal training zone" tone="emerald" />
        </section>
      </div>

      {/* STICKY ACTION BAR */}
      <div className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-4 bg-background/80 backdrop-blur-xl border-t border-border/40">
        <div className="max-w-5xl mx-auto flex items-center gap-2 flex-wrap">
          <Button
            size="lg"
            onClick={() => {
              if (totalExercises > 0) setActive(`warm-0`);
              setOpenSections({ warm: true, main: true, cool: true });
            }}
            className="flex-1 min-w-[180px] bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90 h-12"
          >
            <Play className="h-4 w-4 mr-2" /> Start Workout
          </Button>
          <Button variant="outline" size="lg" onClick={onRegenerate} disabled={generating} className="h-12">
            <RefreshCw className={`h-4 w-4 sm:mr-2 ${generating ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Regenerate</span>
          </Button>
          {onSave && (
            <Button variant="outline" size="lg" onClick={onSave} className="h-12">
              <Bookmark className={`h-4 w-4 sm:mr-2 ${saved ? "fill-primary text-primary" : ""}`} />
              <span className="hidden sm:inline">{saved ? "Saved" : "Save"}</span>
            </Button>
          )}
          <Button variant="outline" size="lg" onClick={onDownload} className="h-12">
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">PDF</span>
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={async () => {
              const url = window.location.href;
              if (navigator.share) {
                try { await navigator.share({ title: parsed.title, url }); } catch {}
              } else {
                navigator.clipboard?.writeText(url);
              }
            }}
            className="h-12"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* RESET CONFIRMATION MODAL */}
      {confirmReset && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fade-in" onClick={() => setConfirmReset(false)}>
          <div className="glass-strong rounded-2xl max-w-md w-full p-6 border border-amber-500/40 shadow-elegant" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 shadow-glow">
                <RefreshCw className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-display text-lg font-bold">Start a fresh cycle?</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              This will <strong className="text-foreground">permanently delete all {cycleDays.length || totalDays} routines</strong> in your current week — including completed days, exercise progress, and recovery signals — then generate a brand-new Day 1 from scratch.
            </p>
            <ul className="mt-3 text-xs text-muted-foreground space-y-1 list-disc pl-5">
              <li>Saved daily routines for this cycle</li>
              <li>Per-exercise checkmarks and completion status</li>
              <li>Day-to-day muscle-group memory used by the AI coach</li>
            </ul>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmReset(false)} disabled={generating}>Cancel</Button>
              <Button
                onClick={() => { setConfirmReset(false); onResetCycle?.(); }}
                disabled={generating || !onResetCycle}
                className="bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-glow"
              >
                {generating ? (<><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Resetting…</>) : (<><Sparkles className="h-4 w-4 mr-2" />Yes, reset & start Day 1</>)}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({ icon: Icon, label, value }: { icon: typeof Flame; label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full glass border border-border/50 px-3 py-1.5">
      <Icon className="h-3.5 w-3.5 text-primary" />
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold">{value}</span>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, unit, tone,
}: { icon: typeof Flame; label: string; value: string; unit: string; tone: "orange" | "primary" | "emerald" | "violet" }) {
  const toneClass = {
    orange: "from-orange-500/20 to-amber-500/5 text-orange-300",
    primary: "from-primary/20 to-purple-500/5 text-primary",
    emerald: "from-emerald-500/20 to-teal-500/5 text-emerald-300",
    violet: "from-violet-500/20 to-fuchsia-500/5 text-violet-300",
  }[tone];
  return (
    <div className={`rounded-2xl p-4 bg-gradient-to-br ${toneClass} border border-border/40 backdrop-blur-md`}>
      <Icon className="h-5 w-5 mb-2" />
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-display text-2xl font-bold mt-0.5 text-foreground">{value}<span className="text-xs font-normal text-muted-foreground ml-1">{unit}</span></p>
    </div>
  );
}

function CircularProgress({ value }: { value: number }) {
  const r = 28;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 70 70" className="h-full w-full -rotate-90">
        <circle cx="35" cy="35" r={r} stroke="currentColor" strokeWidth="6" fill="none" className="text-secondary/40" />
        <circle
          cx="35" cy="35" r={r} stroke="url(#cpg)" strokeWidth="6" fill="none"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-500"
        />
        <defs>
          <linearGradient id="cpg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.62 0.22 275)" />
            <stop offset="100%" stopColor="oklch(0.74 0.18 285)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-display font-bold text-lg">
        {value}%
      </div>
    </div>
  );
}

function InsightCard({ icon: Icon, title, body }: { icon: typeof Flame; title: string; body: string }) {
  return (
    <div className="mt-6 glass rounded-2xl p-4 border border-primary/20 flex gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
        <Icon className="h-5 w-5 text-primary-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">{title}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{body}</p>
      </div>
    </div>
  );
}

function MiniStat({
  icon: Icon, label, value, hint, tone,
}: { icon: typeof Flame; label: string; value: string; hint: string; tone: "sky" | "amber" | "emerald" }) {
  const toneClass = {
    sky: "text-sky-300",
    amber: "text-amber-300",
    emerald: "text-emerald-300",
  }[tone];
  return (
    <div className="glass rounded-2xl p-4 border border-border/40 flex items-center gap-3">
      <Icon className={`h-7 w-7 ${toneClass}`} />
      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="font-display text-lg font-bold leading-tight">{value}</p>
        <p className="text-[10px] text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}

function RecoveryTip({
  icon: Icon, title, body, tone,
}: { icon: typeof Flame; title: string; body: string; tone: "sky" | "rose" | "violet" }) {
  const toneClass = {
    sky: "from-sky-500/20 to-cyan-500/5 text-sky-300 border-sky-500/30",
    rose: "from-rose-500/20 to-pink-500/5 text-rose-300 border-rose-500/30",
    violet: "from-violet-500/20 to-fuchsia-500/5 text-violet-300 border-violet-500/30",
  }[tone];
  return (
    <div className={`rounded-2xl p-4 border bg-gradient-to-br ${toneClass} backdrop-blur-md`}>
      <Icon className="h-5 w-5 mb-2" />
      <p className="text-xs font-semibold uppercase tracking-wider text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{body}</p>
    </div>
  );
}
