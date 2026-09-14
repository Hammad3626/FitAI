import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Clock, Flame, TrendingUp, Bookmark, BookmarkCheck, Sparkles, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { workouts, type Workout } from "@/lib/fitness-data";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { generateCustomRoutine } from "@/lib/chat.functions";
import { RoutineBuilderChat, type RoutineAnswers } from "@/components/routine-builder-chat";
import { RoutineDetail } from "@/components/routine-detail";

export const Route = createFileRoute("/workouts")({
  head: () => ({
    meta: [
      { title: "Workouts — FitAI" },
      { name: "description", content: "Curated routines plus AI-built custom routines tailored to your goal, equipment, and schedule." },
    ],
  }),
  component: WorkoutsPage,
});

const difficultyColor: Record<Workout["difficulty"], string> = {
  Beginner: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Intermediate: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Advanced: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

type CustomRoutine = {
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
  day_number: number;
  cycle_id: string;
  completed: boolean;
  completed_at: string | null;
  completed_exercises: string[];
};

const ANSWERS_KEY = "fitai:lastRoutineAnswers";

function WorkoutsPage() {
  const [active, setActive] = useState<Workout | null>(null);
  const [activeCustom, setActiveCustom] = useState<CustomRoutine | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [customs, setCustoms] = useState<CustomRoutine[]>([]);
  const { user } = useAuth();
  const generate = useServerFn(generateCustomRoutine);

  const [showBuilder, setShowBuilder] = useState(false);
  const [generating, setGenerating] = useState(false);
  const lastAnswersRef = useRef<RoutineAnswers | null>(null);

  // current cycle = newest cycle that has at least one routine
  const currentCycleId = customs[0]?.cycle_id ?? null;
  const cycleRoutines = currentCycleId
    ? [...customs].filter((c) => c.cycle_id === currentCycleId).sort((a, b) => a.day_number - b.day_number)
    : [];

  useEffect(() => {
    if (!user) { setSaved([]); setCustoms([]); return; }
    supabase.from("user_fitness_data").select("saved_workouts").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setSaved(data?.saved_workouts ?? []));
    supabase.from("custom_routines").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setCustoms((data as CustomRoutine[]) ?? []));
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(ANSWERS_KEY) : null;
      if (raw) lastAnswersRef.current = JSON.parse(raw);
    } catch {}
  }, [user]);

  async function toggleSave(id: string, title: string) {
    if (!user) { toast.error("Please sign in to save routines"); return; }
    const isSaved = saved.includes(id);
    const next = isSaved ? saved.filter((s) => s !== id) : [...saved, id];
    setSaved(next);
    const { error } = await supabase.from("user_fitness_data").upsert({ user_id: user.id, saved_workouts: next });
    if (error) toast.error("Failed to save");
    else toast(isSaved ? `Removed "${title}"` : `Saved "${title}"`);
  }

  function levelFor(a: RoutineAnswers): "Beginner" | "Intermediate" | "Advanced" {
    if (a.level === "Intermediate" || a.level === "Advanced") return a.level;
    return "Beginner";
  }
  function intensityFor(a: RoutineAnswers): "Easy" | "Moderate" | "Hard" {
    const goalLower = a.goal.toLowerCase();
    if (goalLower.includes("strength") || goalLower.includes("muscle")) return "Hard";
    if (a.level === "Beginner") return "Easy";
    return "Moderate";
  }

  async function runGenerate(
    a: RoutineAnswers,
    opts?: { day?: number; cycleId?: string; previousTitles?: string[] },
  ) {
    if (!user) { toast.error("Please sign in to build custom routines"); return; }
    setGenerating(true);
    lastAnswersRef.current = a;
    try { window.localStorage.setItem(ANSWERS_KEY, JSON.stringify(a)); } catch {}
    const totalDays = parseInt(a.daysPerWeek) || 3;
    const day = opts?.day ?? 1;
    const cycleId = opts?.cycleId ?? crypto.randomUUID();
    const prevTitles = opts?.previousTitles ?? [];
    try {
      const dayContext =
        day === 1
          ? `This is DAY 1 of a fresh ${totalDays}-day weekly split. Establish the baseline session.`
          : `This is DAY ${day} of a ${totalDays}-day weekly split. Previous days focused on: ${prevTitles.join("; ") || "general training"}. Pick DIFFERENT primary muscle groups, vary movement patterns, and respect 48h recovery for muscles already trained.`;
      const notes = [
        `Gender: ${a.gender}`,
        `Age: ${a.age}`,
        `Height: ${a.height}`,
        `Weight: ${a.weight}`,
        `Workout location: ${a.location}`,
        `Target areas: ${a.targetAreas}`,
        dayContext,
        "Include: warm-up, cool-down, sets/reps/rest, estimated calories, difficulty, and progression tips. Add a beginner-safe note for any listed injuries.",
        `Start the title with "Day ${day} —".`,
      ].join(" · ");
      const res = await generate({
        data: {
          goal: a.goal,
          level: levelFor(a),
          equipment: a.equipment || a.location,
          daysPerWeek: totalDays,
          timeMin: parseInt(a.timeMin) || 30,
          focus: a.targetAreas,
          injuries: a.injuries && a.injuries.toLowerCase() !== "none" ? a.injuries : undefined,
          intensity: intensityFor(a),
          style: a.style,
          notes,
        },
      });
      if (!res.title) { toast.error(res.content || "Couldn't generate"); return; }
      const finalTitle = /^day\s*\d/i.test(res.title) ? res.title : `Day ${day} — ${res.title}`;
      const { data, error } = await supabase.from("custom_routines").insert({
        user_id: user.id,
        title: finalTitle,
        goal: a.goal,
        level: levelFor(a),
        equipment: a.equipment || a.location,
        days_per_week: totalDays,
        time_min: parseInt(a.timeMin) || 30,
        focus: a.targetAreas,
        injuries: a.injuries && a.injuries.toLowerCase() !== "none" ? a.injuries : null,
        intensity: intensityFor(a),
        content: res.content,
        day_number: day,
        cycle_id: cycleId,
        completed: false,
        completed_exercises: [],
      }).select().single();
      if (error || !data) { toast.error("Failed to save routine"); return; }
      setCustoms((prev) => [data as CustomRoutine, ...prev]);
      setActiveCustom(data as CustomRoutine);
      setShowBuilder(false);
      toast.success(`Day ${day} ready: "${finalTitle}"`);
    } catch {
      toast.error("Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function regenerateCurrent() {
    if (!lastAnswersRef.current) { setShowBuilder(true); return; }
    if (!activeCustom) { await runGenerate(lastAnswersRef.current); return; }
    const previous = cycleRoutines
      .filter((c) => c.day_number < activeCustom.day_number)
      .map((c) => c.title);
    await supabase.from("custom_routines").delete().eq("id", activeCustom.id);
    setCustoms((prev) => prev.filter((c) => c.id !== activeCustom.id));
    await runGenerate(lastAnswersRef.current, {
      day: activeCustom.day_number,
      cycleId: activeCustom.cycle_id,
      previousTitles: previous,
    });
  }

  async function completeDay(day: number) {
    if (!user || !activeCustom || !lastAnswersRef.current) return;
    const totalDays = activeCustom.days_per_week ?? (parseInt(lastAnswersRef.current.daysPerWeek) || 3);
    const completedAt = new Date().toISOString();
    await supabase.from("custom_routines")
      .update({ completed: true, completed_at: completedAt })
      .eq("id", activeCustom.id);
    setCustoms((prev) => prev.map((c) => c.id === activeCustom.id ? { ...c, completed: true, completed_at: completedAt } : c));
    setActiveCustom({ ...activeCustom, completed: true, completed_at: completedAt });
    if (day >= totalDays) {
      toast.success(`Day ${day} saved · week complete!`);
      return;
    }
    toast.success(`Day ${day} saved · building Day ${day + 1}…`);
    const previousTitles = cycleRoutines.map((c) => c.title);
    await runGenerate(lastAnswersRef.current, {
      day: day + 1,
      cycleId: activeCustom.cycle_id,
      previousTitles,
    });
  }

  async function resetCycle() {
    if (!user || !lastAnswersRef.current) { setShowBuilder(true); return; }
    if (currentCycleId) {
      await supabase.from("custom_routines").delete().eq("user_id", user.id).eq("cycle_id", currentCycleId);
      setCustoms((prev) => prev.filter((c) => c.cycle_id !== currentCycleId));
    }
    setActiveCustom(null);
    toast("Cycle cleared · generating fresh Day 1");
    await runGenerate(lastAnswersRef.current);
  }

  function jumpToDay(day: number) {
    const target = cycleRoutines.find((c) => c.day_number === day);
    if (target) setActiveCustom(target);
  }

  async function persistExerciseProgress(routineId: string, completedIds: string[]) {
    setCustoms((prev) => prev.map((c) => c.id === routineId ? { ...c, completed_exercises: completedIds } : c));
    if (activeCustom?.id === routineId) setActiveCustom({ ...activeCustom, completed_exercises: completedIds });
    await supabase.from("custom_routines").update({ completed_exercises: completedIds }).eq("id", routineId);
  }

  function downloadRoutine(c: CustomRoutine) {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${c.title}</title>
<style>
body{font-family:-apple-system,Segoe UI,sans-serif;max-width:780px;margin:40px auto;padding:0 24px;color:#111;line-height:1.55}
h1,h2,h3{font-family:inherit}h1{margin-bottom:.2em}
table{border-collapse:collapse;width:100%;margin:12px 0}th,td{border:1px solid #ccc;padding:6px 10px;text-align:left;font-size:14px}
.meta{color:#555;font-size:13px;margin-bottom:24px}
@media print{body{margin:0}}
</style></head><body>
<h1>${c.title}</h1>
<p class="meta">${[c.goal, c.level, c.intensity, c.time_min ? c.time_min + " min" : "", c.days_per_week ? c.days_per_week + "x/wk" : ""].filter(Boolean).join(" · ")}</p>
<pre style="white-space:pre-wrap;font-family:inherit">${c.content.replace(/[<>&]/g, (s) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[s]!))}</pre>
<script>window.onload=()=>setTimeout(()=>window.print(),300)</script>
</body></html>`;
    const w = window.open("", "_blank");
    if (!w) { toast.error("Popup blocked — allow popups to download"); return; }
    w.document.write(html);
    w.document.close();
  }

  async function deleteCustom(id: string) {
    const { error } = await supabase.from("custom_routines").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    setCustoms(customs.filter((c) => c.id !== id));
    toast("Routine deleted");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <header className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="font-display text-4xl sm:text-5xl font-bold">
          Workout <span className="gradient-text">Routines</span>
        </h1>
        <p className="mt-4 text-muted-foreground">
          Pick a curated plan or let the AI build a fresh routine for your exact situation.
        </p>
      </header>

      {/* Custom AI Routines section */}
      <section className="mb-14">
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold">Your Custom AI Routines</h2>
              <p className="text-xs text-muted-foreground">Built from scratch — never reused templates</p>
            </div>
          </div>
          <Button onClick={() => setShowBuilder(true)} className="bg-gradient-primary text-primary-foreground">
            <Plus className="h-4 w-4 mr-1" /> Build My Routine
          </Button>
        </div>

        {customs.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
            No custom routines yet. Click <strong>Build new routine</strong> to generate one tailored to your goal, equipment, and schedule.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {customs.map((c) => (
              <article key={c.id} className="glass-strong rounded-2xl p-5 flex flex-col hover:shadow-glow transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-primary font-semibold">Custom · {c.level || "—"}</p>
                    <h3 className="mt-1 font-display text-lg font-semibold leading-snug">{c.title}</h3>
                  </div>
                  <button onClick={() => deleteCustom(c.id)} aria-label="Delete" className="text-muted-foreground hover:text-rose-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.goal && <Badge variant="outline" className="glass border-border/60 text-[10px]">{c.goal}</Badge>}
                  {c.time_min && <Badge variant="outline" className="glass border-border/60 text-[10px]"><Clock className="h-2.5 w-2.5 mr-1" />{c.time_min}m</Badge>}
                  {c.days_per_week && <Badge variant="outline" className="glass border-border/60 text-[10px]">{c.days_per_week}×/wk</Badge>}
                  {c.intensity && <Badge variant="outline" className="glass border-border/60 text-[10px]">{c.intensity}</Badge>}
                </div>
                <Button onClick={() => setActiveCustom(c)} className="mt-4 bg-gradient-primary text-primary-foreground" size="sm">
                  View Routine <TrendingUp className="ml-2 h-3.5 w-3.5" />
                </Button>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="mb-5">
        <h2 className="font-display text-2xl font-semibold">Curated Library</h2>
        <p className="text-xs text-muted-foreground mt-1">Hand-picked starter routines.</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {workouts.map((w, i) => (
          <article
            key={w.id}
            className="glass-strong rounded-2xl p-6 flex flex-col hover:shadow-glow hover:-translate-y-1 transition-all animate-fade-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-primary font-semibold">{w.category}</p>
                <h2 className="mt-1 font-display text-xl font-semibold">{w.title}</h2>
              </div>
              <button onClick={() => toggleSave(w.id, w.title)} aria-label="Save routine">
                {saved.includes(w.id) ? (
                  <BookmarkCheck className="h-5 w-5 text-primary" />
                ) : (
                  <Bookmark className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                )}
              </button>
            </div>

            <p className="mt-3 text-sm text-muted-foreground flex-1">{w.description}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline" className={difficultyColor[w.difficulty]}>{w.difficulty}</Badge>
              <Badge variant="outline" className="glass border-border/60"><Clock className="h-3 w-3 mr-1" />{w.duration}</Badge>
              <Badge variant="outline" className="glass border-border/60"><Flame className="h-3 w-3 mr-1" />{w.calories} kcal</Badge>
            </div>

            <Button
              onClick={() => setActive(w)}
              className="mt-5 bg-gradient-primary text-primary-foreground hover:opacity-90"
            >
              View Routine <TrendingUp className="ml-2 h-4 w-4" />
            </Button>
          </article>
        ))}
      </div>

      {/* Curated routine modal */}
      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-up" onClick={() => setActive(null)}>
          <div className="glass-strong rounded-2xl max-w-lg w-full p-6 shadow-elegant" onClick={(e) => e.stopPropagation()}>
            <p className="text-xs uppercase tracking-wider text-primary font-semibold">{active.category}</p>
            <h3 className="mt-1 font-display text-2xl font-bold">{active.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{active.description}</p>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="glass rounded-xl p-3"><p className="text-xs text-muted-foreground">Level</p><p className="font-semibold mt-1">{active.difficulty}</p></div>
              <div className="glass rounded-xl p-3"><p className="text-xs text-muted-foreground">Duration</p><p className="font-semibold mt-1">{active.duration}</p></div>
              <div className="glass rounded-xl p-3"><p className="text-xs text-muted-foreground">Calories</p><p className="font-semibold mt-1">{active.calories}</p></div>
            </div>
            <h4 className="mt-6 font-display font-semibold">Exercises</h4>
            <ul className="mt-3 space-y-2">
              {active.exercises.map((e) => (
                <li key={e.name} className="flex items-center justify-between glass rounded-lg px-3 py-2 text-sm">
                  <span>{e.name}</span><span className="text-muted-foreground">{e.sets}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setActive(null)}>Close</Button>
              <Button onClick={() => { toggleSave(active.id, active.title); setActive(null); }} className="bg-gradient-primary text-primary-foreground">
                {saved.includes(active.id) ? "Unsave" : "Save Routine"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Custom routine premium view */}
      {activeCustom && (
        <RoutineDetail
          routine={activeCustom}
          onClose={() => setActiveCustom(null)}
          onRegenerate={regenerateCurrent}
          onDownload={() => downloadRoutine(activeCustom)}
          onCompleteDay={completeDay}
          onResetCycle={resetCycle}
          onJumpToDay={jumpToDay}
          onExerciseProgress={(ids) => persistExerciseProgress(activeCustom.id, ids)}
          dayNumber={activeCustom.day_number}
          totalDays={activeCustom.days_per_week ?? undefined}
          cycleDays={cycleRoutines.map((c) => ({
            day: c.day_number,
            title: c.title,
            completed: c.completed,
            isCurrent: c.id === activeCustom.id,
          }))}
          initialCompletedExercises={activeCustom.completed_exercises ?? []}
          generating={generating}
        />
      )}

      <RoutineBuilderChat
        open={showBuilder}
        onClose={() => setShowBuilder(false)}
        onComplete={(a) => runGenerate(a)}
        generating={generating}
      />
    </div>
  );
}
