import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Activity, Bookmark, Droplets, Flame, Target, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { dailyTips, workouts } from "@/lib/fitness-data";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CoachPanel } from "@/components/coach-panel";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — FitAI" },
      { name: "description", content: "Your fitness goals, saved routines, and daily activity tracker." },
    ],
  }),
  component: Dashboard,
});

type State = {
  goal: string;
  weeklyTarget: number;
  workoutsThisWeek: number;
  waterCups: number;
  saved: string[];
};

const DEFAULT: State = {
  goal: "Build healthy fitness habits",
  weeklyTarget: 4,
  workoutsThisWeek: 0,
  waterCups: 0,
  saved: [],
};

function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<State>(DEFAULT);
  const [hydrated, setHydrated] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  // Load from DB
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("user_fitness_data")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) {
        toast.error("Failed to load your data");
      } else if (data) {
        setState({
          goal: data.goal ?? DEFAULT.goal,
          weeklyTarget: data.weekly_target,
          workoutsThisWeek: data.workouts_this_week,
          waterCups: data.water_cups,
          saved: data.saved_workouts ?? [],
        });
      }
      setHydrated(true);
    })();
  }, [user]);

  // Debounced save
  useEffect(() => {
    if (!hydrated || !user) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const { error } = await supabase.from("user_fitness_data").upsert({
        user_id: user.id,
        goal: state.goal,
        weekly_target: state.weeklyTarget,
        workouts_this_week: state.workoutsThisWeek,
        water_cups: state.waterCups,
        saved_workouts: state.saved,
      });
      if (error) toast.error("Failed to save");
    }, 600);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [state, hydrated, user]);

  function update<K extends keyof State>(k: K, v: State[K]) { setState((s) => ({ ...s, [k]: v })); }
  function unsave(id: string) {
    setState((s) => ({ ...s, saved: s.saved.filter((x) => x !== id) }));
  }

  if (loading || !user) {
    return <div className="mx-auto max-w-7xl px-4 py-20 text-center text-muted-foreground">Loading...</div>;
  }

  const savedWorkouts = workouts.filter((w) => state.saved.includes(w.id));
  const tipOfDay = dailyTips[new Date().getDate() % dailyTips.length];
  const displayName = user.user_metadata?.display_name || user.email?.split("@")[0];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-10">
        <p className="text-sm text-muted-foreground">Welcome back, {displayName}</p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold mt-1">
          Your <span className="gradient-text">Dashboard</span>
        </h1>
        <p className="mt-3 text-muted-foreground">Track goals, log activity, manage saved routines.</p>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass-strong rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary">
              <Target className="h-5 w-5 text-primary-foreground" />
            </div>
            <h2 className="font-display text-xl font-semibold">Current Goal</h2>
          </div>
          <input
            value={state.goal}
            onChange={(e) => update("goal", e.target.value)}
            className="w-full bg-input/60 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Workouts this week</span>
              <span className="font-semibold">{state.workoutsThisWeek} / {state.weeklyTarget}</span>
            </div>
            <Progress value={(state.workoutsThisWeek / state.weeklyTarget) * 100} className="h-2" />
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => update("workoutsThisWeek", Math.max(0, state.workoutsThisWeek - 1))}>−1</Button>
              <Button size="sm" className="bg-gradient-primary text-primary-foreground" onClick={() => update("workoutsThisWeek", state.workoutsThisWeek + 1)}>Log Workout</Button>
              <div className="flex items-center gap-2 ml-auto text-sm text-muted-foreground">
                Target:
                <input
                  type="number"
                  min={1} max={14}
                  value={state.weeklyTarget}
                  onChange={(e) => update("weeklyTarget", parseInt(e.target.value || "1"))}
                  className="w-16 bg-input/60 rounded-lg px-2 py-1 text-center"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="glass-strong rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary">
              <Droplets className="h-5 w-5 text-primary-foreground" />
            </div>
            <h2 className="font-display text-xl font-semibold">Hydration</h2>
          </div>
          <p className="font-display text-4xl font-bold">{state.waterCups}<span className="text-lg text-muted-foreground"> / 8 cups</span></p>
          <Progress value={(state.waterCups / 8) * 100} className="mt-3 h-2" />
          <div className="mt-4 flex gap-2">
            <Button size="sm" variant="outline" onClick={() => update("waterCups", Math.max(0, state.waterCups - 1))}>−</Button>
            <Button size="sm" className="bg-gradient-primary text-primary-foreground flex-1" onClick={() => update("waterCups", Math.min(20, state.waterCups + 1))}>+ Cup</Button>
          </div>
        </div>

        <div className="glass-strong rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <h2 className="font-display text-xl font-semibold">Daily Activity</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: "Workouts", value: state.workoutsThisWeek, icon: Flame, sub: "this week" },
              { label: "Saved routines", value: state.saved.length, icon: Bookmark, sub: "in library" },
              { label: "Streak", value: Math.max(1, state.workoutsThisWeek), icon: Activity, sub: "days active" },
            ].map((s) => (
              <div key={s.label} className="glass rounded-xl p-4">
                <s.icon className="h-5 w-5 text-primary mb-2" />
                <p className="font-display text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label} · {s.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-strong rounded-2xl p-6">
          <h2 className="font-display text-xl font-semibold mb-3">Tip of the day</h2>
          <p className="text-3xl mb-2">{tipOfDay.icon}</p>
          <p className="text-sm leading-relaxed">{tipOfDay.text}</p>
        </div>

        <div className="lg:col-span-3">
          <CoachPanel />
        </div>

        <div className="glass-strong rounded-2xl p-6 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">Saved Routines</h2>
            <Button asChild variant="outline" size="sm"><Link to="/workouts">Browse all</Link></Button>
          </div>
          {savedWorkouts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p>No saved routines yet.</p>
              <Button asChild className="mt-4 bg-gradient-primary text-primary-foreground"><Link to="/workouts">Find a routine</Link></Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedWorkouts.map((w) => (
                <div key={w.id} className="glass rounded-xl p-4 flex flex-col">
                  <p className="text-xs uppercase tracking-wider text-primary font-semibold">{w.category}</p>
                  <h3 className="font-display font-semibold mt-1">{w.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{w.duration} · {w.calories} kcal</p>
                  <button onClick={() => unsave(w.id)} className="mt-3 self-start text-xs text-muted-foreground hover:text-destructive flex items-center gap-1">
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
