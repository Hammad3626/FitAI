import { useState, useEffect } from 'react';
import { Activity, Bookmark, Droplets, Flame, Target, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../utils/supabase';
import { dailyTips, workouts } from '../lib/fitness-data';
import { toast } from 'sonner';

const DEFAULT_STATE = {
  goal: 'Build healthy fitness habits',
  weeklyTarget: 4,
  workoutsThisWeek: 0,
  waterCups: 0,
  saved: [],
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [state, setState] = useState(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  // Load user data from Supabase
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const { data, error } = await supabase
          .from('user_fitness_data')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading data:', error);
        } else if (data) {
          setState({
            goal: data.goal || DEFAULT_STATE.goal,
            weeklyTarget: data.weekly_target || DEFAULT_STATE.weeklyTarget,
            workoutsThisWeek: data.workouts_this_week || 0,
            waterCups: data.water_cups || 0,
            saved: data.saved_workouts || [],
          });
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setHydrated(true);
      }
    };

    loadData();
  }, [user]);

  // Save data to Supabase
  useEffect(() => {
    if (!hydrated || !user) return;

    const saveData = async () => {
      try {
        await supabase.from('user_fitness_data').upsert({
          user_id: user.id,
          goal: state.goal,
          weekly_target: state.weeklyTarget,
          workouts_this_week: state.workoutsThisWeek,
          water_cups: state.waterCups,
          saved_workouts: state.saved,
        });
      } catch (err) {
        console.error('Error saving:', err);
        toast.error('Failed to save');
      }
    };

    const timer = setTimeout(saveData, 600);
    return () => clearTimeout(timer);
  }, [state, hydrated, user]);

  const update = (key, value) => {
    setState(prev => ({ ...prev, [key]: value }));
  };

  const unsave = (id) => {
    setState(prev => ({
      ...prev,
      saved: prev.saved.filter(x => x !== id),
    }));
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const savedWorkouts = workouts.filter(w => state.saved.includes(w.id));
  const tipOfDay = dailyTips[new Date().getDate() % dailyTips.length];
  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0];

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
        {/* Goal Section */}
        <div className="glass-strong rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary">
              <Target className="h-5 w-5 text-primary-foreground" />
            </div>
            <h2 className="font-display text-xl font-semibold">Current Goal</h2>
          </div>
          <input
            type="text"
            value={state.goal}
            onChange={(e) => update('goal', e.target.value)}
            className="w-full bg-input/60 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
          />

          {/* Workouts Progress */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Workouts this week</span>
              <span className="font-semibold">{state.workoutsThisWeek} / {state.weeklyTarget}</span>
            </div>
            <div className="w-full bg-secondary/40 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-primary transition-all duration-300"
                style={{ width: `${(state.workoutsThisWeek / state.weeklyTarget) * 100}%` }}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => update('workoutsThisWeek', Math.max(0, state.workoutsThisWeek - 1))}
              >
                −1
              </Button>
              <Button
                size="sm"
                className="bg-gradient-primary text-primary-foreground"
                onClick={() => update('workoutsThisWeek', state.workoutsThisWeek + 1)}
              >
                Log Workout
              </Button>
              <div className="flex items-center gap-2 ml-auto text-sm text-muted-foreground">
                Target:
                <input
                  type="number"
                  min="1"
                  max="14"
                  value={state.weeklyTarget}
                  onChange={(e) => update('weeklyTarget', parseInt(e.target.value) || 1)}
                  className="w-16 bg-input/60 rounded-lg px-2 py-1 text-center text-foreground"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Hydration Section */}
        <div className="glass-strong rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary">
              <Droplets className="h-5 w-5 text-primary-foreground" />
            </div>
            <h2 className="font-display text-xl font-semibold">Hydration</h2>
          </div>
          <p className="font-display text-4xl font-bold">{state.waterCups}<span className="text-lg text-muted-foreground"> / 8 cups</span></p>
          <div className="mt-3 w-full bg-secondary/40 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-primary transition-all duration-300"
              style={{ width: `${(state.waterCups / 8) * 100}%` }}
            />
          </div>
          <div className="mt-4 flex gap-2">
            <Button size="sm" variant="outline" onClick={() => update('waterCups', Math.max(0, state.waterCups - 1))}>−</Button>
            <Button
              size="sm"
              className="bg-gradient-primary text-primary-foreground flex-1"
              onClick={() => update('waterCups', Math.min(20, state.waterCups + 1))}
            >
              + Cup
            </Button>
          </div>
        </div>

        {/* Activity Stats */}
        <div className="glass-strong rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <h2 className="font-display text-xl font-semibold">Daily Activity</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="glass rounded-xl p-4">
              <Flame className="h-5 w-5 text-primary mb-2" />
              <p className="font-display text-2xl font-bold">{state.workoutsThisWeek}</p>
              <p className="text-xs text-muted-foreground">Workouts · this week</p>
            </div>
            <div className="glass rounded-xl p-4">
              <Bookmark className="h-5 w-5 text-primary mb-2" />
              <p className="font-display text-2xl font-bold">{state.saved.length}</p>
              <p className="text-xs text-muted-foreground">Saved routines · in library</p>
            </div>
            <div className="glass rounded-xl p-4">
              <Activity className="h-5 w-5 text-primary mb-2" />
              <p className="font-display text-2xl font-bold">{Math.max(1, state.workoutsThisWeek)}</p>
              <p className="text-xs text-muted-foreground">Streak · days active</p>
            </div>
          </div>
        </div>

        {/* Tip of the Day */}
        <div className="glass-strong rounded-2xl p-6">
          <h2 className="font-display text-xl font-semibold mb-3">Tip of the day</h2>
          <p className="text-3xl mb-2">{tipOfDay.icon}</p>
          <p className="text-sm leading-relaxed">{tipOfDay.text}</p>
        </div>

        {/* Saved Routines */}
        <div className="glass-strong rounded-2xl p-6 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">Saved Routines</h2>
            <Button asChild variant="outline" size="sm">
              <a href="/workouts">Browse all</a>
            </Button>
          </div>
          {savedWorkouts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p>No saved routines yet.</p>
              <Button asChild className="mt-4 bg-gradient-primary text-primary-foreground">
                <a href="/workouts">Find a routine</a>
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedWorkouts.map((w) => (
                <div key={w.id} className="glass rounded-xl p-4 flex flex-col">
                  <p className="text-xs uppercase tracking-wider text-primary font-semibold">{w.category}</p>
                  <h3 className="font-display font-semibold mt-1">{w.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{w.duration} · {w.calories} kcal</p>
                  <button
                    onClick={() => unsave(w.id)}
                    className="mt-3 self-start text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                  >
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
