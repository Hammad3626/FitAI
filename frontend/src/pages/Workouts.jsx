import React, { useEffect, useRef, useState } from 'react';
import {
  Clock,
  Flame,
  TrendingUp,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  Trash2,
  Plus,
  X,
  Lock,
} from 'lucide-react';
import { workouts } from '../data/fitnessData';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';
import { RoutineBuilderChat } from '../components/RoutineBuilderChat';
import { RoutineDetail } from '../components/RoutineDetail';
import { useNavigate } from 'react-router-dom';

const difficultyColor = {
  Beginner: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  Intermediate: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  Advanced: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
};

const ANSWERS_KEY = 'fitai:lastRoutineAnswers';

export function Workouts() {
  const [activeCurated, setActiveCurated] = useState(null);
  const [activeCustom, setActiveCustom] = useState(null);
  const [savedWorkouts, setSavedWorkouts] = useState([]);
  const [customRoutines, setCustomRoutines] = useState([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [generating, setGenerating] = useState(false);

  const { user, canAccessFeature } = useAuth();
  const navigate = useNavigate();
  const lastAnswersRef = useRef(null);

  // Load saved workouts and custom routines from backend
  useEffect(() => {
    if (!user) {
      setSavedWorkouts([]);
      setCustomRoutines([]);
      return;
    }

    api.get('/fitness-data')
      .then((data) => {
        if (data && data.savedWorkouts) setSavedWorkouts(data.savedWorkouts);
      })
      .catch((err) => console.error('Failed to load saved workouts:', err));

    api.get('/routines')
      .then((data) => {
        if (Array.isArray(data)) setCustomRoutines(data);
      })
      .catch((err) => console.error('Failed to load custom routines:', err));

    try {
      const raw = localStorage.getItem(ANSWERS_KEY);
      if (raw) lastAnswersRef.current = JSON.parse(raw);
    } catch {}
  }, [user]);

  // Current active cycle
  const currentCycleId = customRoutines[0]?.cycleId || null;
  const cycleRoutines = currentCycleId
    ? [...customRoutines]
        .filter((c) => c.cycleId === currentCycleId)
        .sort((a, b) => a.dayNumber - b.dayNumber)
    : [];

  // Toggle save/unsave on curated routines
  const toggleSave = async (id, title) => {
    if (!user) {
      toast.error('Please sign in to save routines');
      return;
    }

    const isSaved = savedWorkouts.includes(id);
    const nextSaved = isSaved
      ? savedWorkouts.filter((s) => s !== id)
      : [...savedWorkouts, id];

    setSavedWorkouts(nextSaved);

    try {
      await api.put('/fitness-data', { savedWorkouts: nextSaved });
      toast.success(isSaved ? `Removed "${title}"` : `Saved "${title}" to library`);
    } catch (err) {
      toast.error('Failed to update saved workouts');
    }
  };

  // Run AI routine generation
  const runGenerate = async (answers, opts = {}) => {
    if (!user) {
      toast.error('Please sign in to build custom routines');
      return;
    }

    setGenerating(true);
    lastAnswersRef.current = answers;
    try {
      localStorage.setItem(ANSWERS_KEY, JSON.stringify(answers));
    } catch {}

    const totalDays = parseInt(answers.daysPerWeek) || 3;
    const day = opts.day || 1;
    const cycleId = opts.cycleId || `cycle_${Date.now()}`;
    const prevTitles = opts.previousTitles || [];

    try {
      const res = await api.post('/chat/generate-routine', {
        goal: answers.goal,
        level: answers.level,
        equipment: answers.equipment || answers.location,
        daysPerWeek: totalDays,
        timeMin: parseInt(answers.timeMin) || 30,
        focus: answers.targetAreas,
        injuries: answers.injuries !== 'none' ? answers.injuries : '',
        day,
        previousTitles: prevTitles,
      });

      if (!res.title || !res.content) {
        toast.error('Could not generate routine content');
        return;
      }

      const finalTitle = /^day\s*\d/i.test(res.title) ? res.title : `Day ${day} — ${res.title}`;

      // Save to MongoDB
      const savedDoc = await api.post('/routines', {
        title: finalTitle,
        goal: answers.goal,
        level: answers.level,
        equipment: answers.equipment || answers.location,
        daysPerWeek: totalDays,
        timeMin: parseInt(answers.timeMin) || 30,
        focus: answers.targetAreas,
        injuries: answers.injuries !== 'none' ? answers.injuries : '',
        content: res.content,
        dayNumber: day,
        cycleId,
        completed: false,
        completedExercises: [],
      });

      setCustomRoutines((prev) => [savedDoc, ...prev]);
      setActiveCustom(savedDoc);
      setShowBuilder(false);
      toast.success(`Day ${day} ready: "${finalTitle}"`);
    } catch (err) {
      console.error(err);
      toast.error('Routine generation failed');
    } finally {
      setGenerating(false);
    }
  };

  // Regenerate current day
  const regenerateCurrent = async () => {
    if (!lastAnswersRef.current) {
      setShowBuilder(true);
      return;
    }
    if (!activeCustom) {
      await runGenerate(lastAnswersRef.current);
      return;
    }

    const previous = cycleRoutines
      .filter((c) => c.dayNumber < activeCustom.dayNumber)
      .map((c) => c.title);

    try {
      await api.delete(`/routines/${activeCustom._id}`);
      setCustomRoutines((prev) => prev.filter((c) => c._id !== activeCustom._id));
      await runGenerate(lastAnswersRef.current, {
        day: activeCustom.dayNumber,
        cycleId: activeCustom.cycleId,
        previousTitles: previous,
      });
    } catch (err) {
      toast.error('Failed to regenerate');
    }
  };

  // Mark day complete & generate next day
  const completeDay = async (day) => {
    if (!user || !activeCustom || !lastAnswersRef.current) return;

    const totalDays = activeCustom.daysPerWeek || parseInt(lastAnswersRef.current.daysPerWeek) || 3;
    const completedAt = new Date().toISOString();

    try {
      const updated = await api.put(`/routines/${activeCustom._id}`, {
        completed: true,
        completedAt,
      });

      setCustomRoutines((prev) =>
        prev.map((c) => (c._id === activeCustom._id ? { ...c, completed: true, completedAt } : c))
      );
      setActiveCustom({ ...activeCustom, completed: true, completedAt });

      if (day >= totalDays) {
        toast.success(`Day ${day} saved · Week cycle complete! 🏆`);
        return;
      }

      toast.success(`Day ${day} saved · Building Day ${day + 1}…`);
      const previousTitles = cycleRoutines.map((c) => c.title);
      await runGenerate(lastAnswersRef.current, {
        day: day + 1,
        cycleId: activeCustom.cycleId,
        previousTitles,
      });
    } catch (err) {
      toast.error('Failed to complete day');
    }
  };

  // Reset entire cycle
  const resetCycle = async () => {
    if (!user || !lastAnswersRef.current) {
      setShowBuilder(true);
      return;
    }

    if (currentCycleId) {
      try {
        await api.delete(`/routines/cycle/${currentCycleId}`);
        setCustomRoutines((prev) => prev.filter((c) => c.cycleId !== currentCycleId));
      } catch (err) {
        console.error(err);
      }
    }

    setActiveCustom(null);
    toast('Cycle cleared · generating fresh Day 1');
    await runGenerate(lastAnswersRef.current);
  };

  const jumpToDay = (day) => {
    const target = cycleRoutines.find((c) => c.dayNumber === day);
    if (target) setActiveCustom(target);
  };

  // Persist exercise checkbox progress
  const persistExerciseProgress = async (routineId, completedExercises) => {
    setCustomRoutines((prev) =>
      prev.map((c) => (c._id === routineId ? { ...c, completedExercises } : c))
    );
    if (activeCustom?._id === routineId) {
      setActiveCustom({ ...activeCustom, completedExercises });
    }
    try {
      await api.put(`/routines/${routineId}`, { completedExercises });
    } catch (err) {
      console.error(err);
    }
  };

  // Delete custom routine
  const deleteCustom = async (id) => {
    try {
      await api.delete(`/routines/${id}`);
      setCustomRoutines((prev) => prev.filter((c) => c._id !== id));
      toast.success('Routine deleted');
    } catch {
      toast.error('Failed to delete routine');
    }
  };

  // Download / Print routine
  const downloadRoutine = (c) => {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${c.title}</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;max-width:780px;margin:40px auto;padding:0 24px;color:#111;line-height:1.6}
h1{margin-bottom:.2em;color:#1d1135}
table{border-collapse:collapse;width:100%;margin:16px 0}th,td{border:1px solid #ddd;padding:8px 12px;text-align:left;font-size:14px}
th{background:#f4f4f6}
.meta{color:#666;font-size:13px;margin-bottom:24px}
@media print{body{margin:0}}
</style></head><body>
<h1>${c.title}</h1>
<p class="meta">${[c.goal, c.level, c.intensity, c.timeMin ? c.timeMin + ' min' : '', c.daysPerWeek ? c.daysPerWeek + 'x/wk' : ''].filter(Boolean).join(' · ')}</p>
<pre style="white-space:pre-wrap;font-family:inherit;background:#f9f9fb;padding:16px;border-radius:8px">${c.content.replace(/[<>&]/g, (s) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[s]))}</pre>
<script>window.onload=()=>setTimeout(()=>window.print(),300)</script>
</body></html>`;
    const w = window.open('', '_blank');
    if (!w) {
      toast.error('Popup blocked — please allow popups to download');
      return;
    }
    w.document.write(html);
    w.document.close();
  };

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

      {/* Custom AI Routines Section */}
      <section className="mb-14">
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold">Your Custom AI Routines</h2>
              <p className="text-xs text-muted-foreground">Built from scratch — tailored to your goals</p>
            </div>
          </div>
          {canAccessFeature('personalized-routine') ? (
            <button
              onClick={() => setShowBuilder(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground hover:opacity-90 font-medium shadow-glow transition-opacity"
            >
              <Plus className="h-4 w-4" /> Build My Routine
            </button>
          ) : (
            <button
              onClick={() => {
                toast.error('Custom routines require a Basic or Pro plan');
                navigate('/pricing');
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border/60 text-muted-foreground hover:bg-secondary font-medium transition-colors"
            >
              <Lock className="h-4 w-4" /> Basic+ Required
            </button>
          )}
        </div>

        {customRoutines.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
            No custom routines yet. Click <strong>Build My Routine</strong> to generate one tailored
            to your goal, equipment, and schedule.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {customRoutines.map((c) => (
              <article
                key={c._id}
                className="glass-strong rounded-2xl p-5 flex flex-col hover:shadow-glow transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-primary font-semibold">
                      Custom · {c.level || 'Beginner'}
                    </p>
                    <h3 className="mt-1 font-display text-lg font-semibold leading-snug">{c.title}</h3>
                  </div>
                  <button
                    onClick={() => deleteCustom(c._id)}
                    aria-label="Delete routine"
                    className="text-muted-foreground hover:text-rose-400 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.goal && (
                    <span className="glass border border-border/60 text-[10px] px-2.5 py-0.5 rounded-full">
                      {c.goal}
                    </span>
                  )}
                  {c.timeMin && (
                    <span className="glass border border-border/60 text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {c.timeMin}m
                    </span>
                  )}
                  {c.daysPerWeek && (
                    <span className="glass border border-border/60 text-[10px] px-2.5 py-0.5 rounded-full">
                      {c.daysPerWeek}×/wk
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setActiveCustom(c)}
                  className="mt-4 flex items-center justify-center gap-1.5 w-full bg-gradient-primary text-primary-foreground py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  View Routine <TrendingUp className="h-3.5 w-3.5 ml-1" />
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Curated Library Section */}
      <section>
        <div className="mb-5">
          <h2 className="font-display text-2xl font-semibold">Curated Starter Library</h2>
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
                  <p className="text-xs uppercase tracking-wider text-primary font-semibold">
                    {w.category}
                  </p>
                  <h2 className="mt-1 font-display text-xl font-semibold">{w.title}</h2>
                </div>
                <button
                  onClick={() => toggleSave(w.id, w.title)}
                  aria-label="Save routine"
                  className="p-1"
                >
                  {savedWorkouts.includes(w.id) ? (
                    <BookmarkCheck className="h-5 w-5 text-primary" />
                  ) : (
                    <Bookmark className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                  )}
                </button>
              </div>

              <p className="mt-3 text-sm text-muted-foreground flex-1">{w.description}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className={`text-xs px-2.5 py-1 rounded-full border ${difficultyColor[w.difficulty]}`}
                >
                  {w.difficulty}
                </span>
                <span className="glass border border-border/60 text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {w.duration}
                </span>
                <span className="glass border border-border/60 text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Flame className="h-3 w-3" />
                  {w.calories} kcal
                </span>
              </div>

              <button
                onClick={() => setActiveCurated(w)}
                className="mt-5 flex items-center justify-center gap-2 w-full bg-gradient-primary text-primary-foreground py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                View Routine <TrendingUp className="h-4 w-4" />
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* Curated Routine Detail Modal */}
      {activeCurated && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-up"
          onClick={() => setActiveCurated(null)}
        >
          <div
            className="glass-strong rounded-2xl max-w-lg w-full p-6 shadow-elegant"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-primary font-semibold">
                  {activeCurated.category}
                </p>
                <h3 className="mt-1 font-display text-2xl font-bold">{activeCurated.title}</h3>
              </div>
              <button
                onClick={() => setActiveCurated(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">{activeCurated.description}</p>

            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="glass rounded-xl p-3">
                <p className="text-xs text-muted-foreground">Level</p>
                <p className="font-semibold mt-1 text-sm">{activeCurated.difficulty}</p>
              </div>
              <div className="glass rounded-xl p-3">
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="font-semibold mt-1 text-sm">{activeCurated.duration}</p>
              </div>
              <div className="glass rounded-xl p-3">
                <p className="text-xs text-muted-foreground">Calories</p>
                <p className="font-semibold mt-1 text-sm">{activeCurated.calories} kcal</p>
              </div>
            </div>

            <h4 className="mt-6 font-display font-semibold text-sm">Exercises</h4>
            <ul className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
              {activeCurated.exercises.map((e) => (
                <li
                  key={e.name}
                  className="flex items-center justify-between glass rounded-lg px-3 py-2 text-sm"
                >
                  <span>{e.name}</span>
                  <span className="text-muted-foreground text-xs">{e.sets}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setActiveCurated(null)}
                className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-secondary transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  toggleSave(activeCurated.id, activeCurated.title);
                  setActiveCurated(null);
                }}
                className="bg-gradient-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
              >
                {savedWorkouts.includes(activeCurated.id) ? 'Unsave' : 'Save Routine'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Routine Premium View */}
      {activeCustom && (
        <RoutineDetail
          routine={activeCustom}
          onClose={() => setActiveCustom(null)}
          onRegenerate={regenerateCurrent}
          onDownload={() => downloadRoutine(activeCustom)}
          onCompleteDay={completeDay}
          onResetCycle={resetCycle}
          onJumpToDay={jumpToDay}
          onExerciseProgress={(ids) => persistExerciseProgress(activeCustom._id, ids)}
          dayNumber={activeCustom.dayNumber}
          totalDays={activeCustom.daysPerWeek}
          cycleDays={cycleRoutines.map((c) => ({
            day: c.dayNumber,
            title: c.title,
            completed: c.completed,
            isCurrent: c._id === activeCustom._id,
          }))}
          initialCompletedExercises={activeCustom.completedExercises || []}
          generating={generating}
        />
      )}

      {/* Questionnaire Chat Modal */}
      <RoutineBuilderChat
        open={showBuilder}
        onClose={() => setShowBuilder(false)}
        onComplete={(a) => runGenerate(a)}
        generating={generating}
      />
    </div>
  );
}
