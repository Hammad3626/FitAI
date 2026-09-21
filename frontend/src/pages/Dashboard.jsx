import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Bookmark, Droplets, Flame, Target, Trash2, Award, Dumbbell, Utensils, UserCheck, MessageSquare, ChevronDown, ChevronUp, Zap, CreditCard, Lock, Sparkles } from 'lucide-react';
import { dailyTips, workouts } from '../data/fitnessData';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { toast } from '../components/Toast';
import { CoachPanel } from '../components/CoachPanel';
import { ClientChat } from '../components/ClientChat';

const DEFAULT_STATE = {
  goal: 'Build healthy fitness habits',
  weeklyTarget: 4,
  workoutsThisWeek: 0,
  waterCups: 0,
  savedWorkouts: [],
};

export function Dashboard() {
  const { user, loading, subscription, canAccessFeature } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const saveTimer = useRef(null);

  const [trainerStatus, setTrainerStatus] = useState(null);
  const [assignedWorkouts, setAssignedWorkouts] = useState([]);
  const [assignedNutrition, setAssignedNutrition] = useState([]);
  const [showChat, setShowChat] = useState(false);

  // Redirect if unauthenticated or if trainer/admin
  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth');
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'trainer') {
        navigate('/trainer/dashboard');
      }
    }
  }, [user, loading, navigate]);

  // Load from MongoDB
  useEffect(() => {
    if (!user || user.role === 'trainer' || user.role === 'admin') return;
    api.get('/fitness-data')
      .then((data) => {
        if (data) {
          setState({
            goal: data.goal || DEFAULT_STATE.goal,
            weeklyTarget: data.weeklyTarget || DEFAULT_STATE.weeklyTarget,
            workoutsThisWeek: data.workoutsThisWeek || 0,
            waterCups: data.waterCups || 0,
            savedWorkouts: data.savedWorkouts || [],
          });
        }
        setHydrated(true);
      })
      .catch((err) => {
        console.error('Failed to load fitness data:', err);
        toast.error('Failed to load your data');
        setHydrated(true);
      });

    // Load trainer status & assigned plans
    api.get('/user-trainer/status').then((data) => {
      if (data) setTrainerStatus(data);
    }).catch(() => {});

    api.get('/user-trainer/workouts').then((data) => {
      if (Array.isArray(data)) setAssignedWorkouts(data);
    }).catch(() => {});

    api.get('/user-trainer/nutrition').then((data) => {
      if (Array.isArray(data)) setAssignedNutrition(data);
    }).catch(() => {});
  }, [user]);

  // Debounced auto-save to MongoDB
  useEffect(() => {
    if (!hydrated || !user) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(async () => {
      try {
        await api.put('/fitness-data', {
          goal: state.goal,
          weeklyTarget: state.weeklyTarget,
          workoutsThisWeek: state.workoutsThisWeek,
          waterCups: state.waterCups,
          savedWorkouts: state.savedWorkouts,
        });
      } catch (err) {
        toast.error('Failed to save changes');
      }
    }, 600);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state, hydrated, user]);

  const update = (key, value) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const unsave = (id) => {
    setState((prev) => ({
      ...prev,
      savedWorkouts: prev.savedWorkouts.filter((x) => x !== id),
    }));
    toast.success('Routine removed from saved list');
  };

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-muted-foreground">
        Loading your dashboard...
      </div>
    );
  }

  const savedList = workouts.filter((w) => state.savedWorkouts.includes(w.id));
  const tipOfDay = dailyTips[new Date().getDate() % dailyTips.length];
  const displayName = user.displayName || user.email?.split('@')[0];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-10">
        <p className="text-sm text-muted-foreground">Welcome back, {displayName}</p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold mt-1">
          Your <span className="gradient-text">Dashboard</span>
        </h1>
        <p className="mt-3 text-muted-foreground">
          Track goals, log activity, manage saved routines.
        </p>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Current Goal Box */}
        <div className="glass-strong rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary">
              <Target className="h-5 w-5 text-primary-foreground" />
            </div>
            <h2 className="font-display text-xl font-semibold">Current Goal</h2>
          </div>
          <input
            value={state.goal}
            onChange={(e) => update('goal', e.target.value)}
            className="w-full bg-input/60 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-ring border border-border/40 text-foreground"
          />
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Workouts this week</span>
              <span className="font-semibold">
                {state.workoutsThisWeek} / {state.weeklyTarget}
              </span>
            </div>
            <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-primary transition-all duration-300"
                style={{
                  width: `${Math.min(100, (state.workoutsThisWeek / state.weeklyTarget) * 100)}%`,
                }}
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                onClick={() => update('workoutsThisWeek', Math.max(0, state.workoutsThisWeek - 1))}
                className="px-3 py-1.5 rounded-lg border border-border/60 hover:bg-secondary text-sm font-medium transition-colors"
              >
                −1
              </button>
              <button
                onClick={() => update('workoutsThisWeek', state.workoutsThisWeek + 1)}
                className="px-4 py-1.5 rounded-lg bg-gradient-primary text-primary-foreground hover:opacity-90 text-sm font-medium transition-opacity"
              >
                Log Workout
              </button>
              <div className="flex items-center gap-2 ml-auto text-sm text-muted-foreground">
                Target:
                <input
                  type="number"
                  min={1}
                  max={14}
                  value={state.weeklyTarget}
                  onChange={(e) => update('weeklyTarget', parseInt(e.target.value || '1'))}
                  className="w-16 bg-input/60 rounded-lg px-2 py-1 text-center border border-border/40 text-foreground"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Hydration Tracker */}
        <div className="glass-strong rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary">
              <Droplets className="h-5 w-5 text-primary-foreground" />
            </div>
            <h2 className="font-display text-xl font-semibold">Hydration</h2>
          </div>
          <p className="font-display text-4xl font-bold">
            {state.waterCups}
            <span className="text-lg text-muted-foreground"> / 8 cups</span>
          </p>
          <div className="h-2.5 bg-secondary rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-gradient-primary transition-all duration-300"
              style={{ width: `${Math.min(100, (state.waterCups / 8) * 100)}%` }}
            />
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => update('waterCups', Math.max(0, state.waterCups - 1))}
              className="px-3 py-1.5 rounded-lg border border-border/60 hover:bg-secondary text-sm font-medium transition-colors"
            >
              −
            </button>
            <button
              onClick={() => update('waterCups', Math.min(20, state.waterCups + 1))}
              className="flex-1 py-1.5 rounded-lg bg-gradient-primary text-primary-foreground hover:opacity-90 text-sm font-medium transition-opacity"
            >
              + Cup
            </button>
          </div>
        </div>

        {/* Daily Activity Stats */}
        <div className="glass-strong rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <h2 className="font-display text-xl font-semibold">Daily Activity</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                label: 'Workouts',
                value: state.workoutsThisWeek,
                icon: Flame,
                sub: 'this week',
              },
              {
                label: 'Saved routines',
                value: state.savedWorkouts.length,
                icon: Bookmark,
                sub: 'in library',
              },
              {
                label: 'Streak',
                value: Math.max(1, state.workoutsThisWeek),
                icon: Activity,
                sub: 'days active',
              },
            ].map((s) => (
              <div key={s.label} className="glass rounded-xl p-4">
                <s.icon className="h-5 w-5 text-primary mb-2" />
                <p className="font-display text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">
                  {s.label} · {s.sub}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Tip of the day */}
        <div className="glass-strong rounded-2xl p-6">
          <h2 className="font-display text-xl font-semibold mb-3">Tip of the day</h2>
          <p className="text-3xl mb-2">{tipOfDay.icon}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{tipOfDay.text}</p>
        </div>

        {/* My Subscription Card */}
        <div className="glass-strong rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary">
              <CreditCard className="h-5 w-5 text-primary-foreground" />
            </div>
            <h2 className="font-display text-xl font-semibold">My Subscription</h2>
          </div>
          {subscription ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-display text-2xl font-bold ${
                    subscription.planId === 'pro' ? 'gradient-text' :
                    subscription.planId === 'basic' ? 'text-cyan-400' : 'text-foreground'
                  }`}>
                    {subscription.planName}
                  </span>
                  {subscription.planId !== 'free' && (
                    <Zap className="h-4 w-4 text-amber-400" />
                  )}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                    subscription.status === 'active'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}>
                    {subscription.status === 'active' ? 'Active' : subscription.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {subscription.price === 0
                    ? 'Free plan — upgrade for more features'
                    : `Rs. ${subscription.price.toLocaleString()}/month`}
                </p>
                {subscription.endDate && subscription.planId !== 'free' && (
                  <p className="text-xs text-muted-foreground">
                    Renews: {new Date(subscription.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </div>
              <Link
                to="/pricing"
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity ${
                  subscription.planId === 'pro'
                    ? 'glass border border-border/60 hover:bg-secondary text-foreground'
                    : 'bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow'
                }`}
              >
                {subscription.planId === 'pro' ? (
                  <><Sparkles className="h-4 w-4" /> Manage Plan</>
                ) : (
                  <><Zap className="h-4 w-4" /> Upgrade Plan</>
                )}
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading subscription...</p>
          )}
        </div>

        {/* Embedded Coach Panel */}
        <div className="lg:col-span-3">
          <CoachPanel fitnessData={state} />
        </div>

        {/* Personal Coach & Assigned Programs */}
        <div className="glass-strong rounded-2xl p-6 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">Your Personal Fitness Coach</h2>
            </div>
            <Link
              to="/trainers"
              className="text-xs px-3 py-1.5 rounded-lg border border-border/60 hover:bg-secondary transition-colors"
            >
              Browse Coaches
            </Link>
          </div>

          {trainerStatus?.connectedTrainer ? (
            <div className="space-y-6">
              {/* Connected Coach Card */}
              <div className="glass rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {trainerStatus.connectedTrainer.profileImage ? (
                    <img
                      src={trainerStatus.connectedTrainer.profileImage}
                      alt={trainerStatus.connectedTrainer.displayName}
                      className="h-14 w-14 rounded-2xl object-cover border border-primary/40 shadow-glow shrink-0"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-2xl bg-gradient-primary flex items-center justify-center font-display font-bold text-xl text-primary-foreground shadow-glow shrink-0">
                      {trainerStatus.connectedTrainer.displayName?.[0] || 'C'}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-lg font-bold">
                        {trainerStatus.connectedTrainer.displayName}
                      </h3>
                      <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
                        Active Coach
                      </span>
                    </div>
                    <p className="text-xs text-primary font-medium">
                      {trainerStatus.connectedTrainer.specialization}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {trainerStatus.connectedTrainer.location || 'Online Coaching'} · {trainerStatus.connectedTrainer.experience}
                    </p>
                  </div>
                </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                  <Link
                    to={`/trainers/${trainerStatus.connectedTrainer._id}`}
                    className="px-3.5 py-1.5 rounded-lg glass border border-border/60 hover:bg-secondary text-xs font-semibold transition-colors"
                  >
                    View Coach Profile
                  </Link>
                  {/* Chat toggle button — Pro plan only */}
                  {canAccessFeature('trainer-messaging') ? (
                    <button
                      onClick={() => setShowChat((prev) => !prev)}
                      className="relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-primary text-primary-foreground text-xs font-semibold shadow-glow hover:opacity-90 transition-opacity"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Message Coach
                      {trainerStatus.unreadMessagesCount > 0 && (
                        <span className="absolute -top-2 -right-2 h-4 min-w-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow">
                          {trainerStatus.unreadMessagesCount > 9 ? '9+' : trainerStatus.unreadMessagesCount}
                        </span>
                      )}
                      {showChat ? (
                        <ChevronUp className="h-3 w-3 ml-0.5" />
                      ) : (
                        <ChevronDown className="h-3 w-3 ml-0.5" />
                      )}
                    </button>
                  ) : (
                    <Link
                      to="/pricing"
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-border/60 text-xs font-semibold text-muted-foreground hover:bg-secondary transition-colors"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      Pro Only
                    </Link>
                  )}
                </div>
              </div>

              {/* ── Chat Panel ─────────────────────────────────────── */}
              {showChat && (
                <div className="glass rounded-xl p-4 animate-fade-up">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
                      <MessageSquare className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-sm">
                        Chat with {trainerStatus.connectedTrainer.displayName}
                      </h3>
                      <p className="text-[10px] text-muted-foreground">
                        {trainerStatus.connectedTrainer.specialization}
                      </p>
                    </div>
                    {trainerStatus.unreadMessagesCount > 0 && (
                      <span className="ml-auto text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-semibold">
                        {trainerStatus.unreadMessagesCount} unread
                      </span>
                    )}
                  </div>
                  <ClientChat
                    trainer={trainerStatus.connectedTrainer}
                    userId={user?._id || user?.id}
                  />
                </div>
              )}

              {/* Assigned Workout Plans by Coach */}

              {assignedWorkouts.length > 0 && (
                <div>
                  <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-primary" /> Workouts Assigned by Your Coach
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {assignedWorkouts.map((wp) => (
                      <div key={wp._id} className="glass rounded-xl p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] text-primary uppercase font-semibold">
                              {wp.goal} · {wp.duration}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{wp.schedule}</span>
                          </div>
                          <h4 className="font-display font-bold text-base">{wp.title}</h4>
                          {wp.description && (
                            <p className="text-xs text-muted-foreground mt-1">{wp.description}</p>
                          )}
                          <ul className="mt-3 space-y-1 text-xs max-h-28 overflow-y-auto">
                            {wp.exercises?.map((ex, i) => (
                              <li key={i} className="flex justify-between bg-input/40 px-2 py-1 rounded">
                                <span>{ex.name}</span>
                                <span className="text-muted-foreground">
                                  {ex.sets} × {ex.reps}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        {wp.notes && (
                          <p className="mt-2 pt-2 border-t border-border/40 text-[11px] text-muted-foreground italic">
                            Coach: {wp.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assigned Nutrition Plans by Coach */}
              {assignedNutrition.length > 0 && (
                <div>
                  <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
                    <Utensils className="h-4 w-4 text-emerald-400" /> Nutrition Plans Assigned by Your Coach
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {assignedNutrition.map((np) => (
                      <div key={np._id} className="glass rounded-xl p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] text-emerald-400 uppercase font-semibold">
                              {np.dailyCalories} kcal Target
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              P: {np.proteinGrams}g · C: {np.carbsGrams}g · F: {np.fatsGrams}g
                            </span>
                          </div>
                          <h4 className="font-display font-bold text-base">{np.title}</h4>
                          <ul className="mt-3 space-y-1 text-xs max-h-28 overflow-y-auto">
                            {np.meals?.map((m, i) => (
                              <li key={i} className="bg-input/40 px-2 py-1 rounded">
                                <span className="font-semibold text-primary">{m.mealName}: </span>
                                <span className="text-muted-foreground">{m.items}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        {np.notes && (
                          <p className="mt-2 pt-2 border-t border-border/40 text-[11px] text-muted-foreground italic">
                            Coach: {np.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : trainerStatus?.pendingRequest ? (
            <div className="glass rounded-xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
                  ⏳
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    Training Request Pending with {trainerStatus.pendingRequest.trainer?.displayName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Goal: {trainerStatus.pendingRequest.goal} · Waiting for coach review
                  </p>
                </div>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium">
                Pending
              </span>
            </div>
          ) : (
            <div className="glass rounded-xl p-6 text-center max-w-xl mx-auto">
              <Award className="h-8 w-8 text-primary mx-auto mb-2 opacity-80" />
              <h3 className="font-display font-semibold text-base">Accelerate with 1-on-1 Coaching</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Connect directly with certified personal trainers for custom workout splits, macro targets, and ongoing accountability.
              </p>
              <Link
                to="/trainers"
                className="inline-block bg-gradient-primary text-primary-foreground px-5 py-2 rounded-xl text-xs font-semibold shadow-glow hover:opacity-90 transition-opacity"
              >
                Browse Certified Trainers
              </Link>
            </div>
          )}
        </div>

        {/* Saved Routines */}
        <div className="glass-strong rounded-2xl p-6 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">Saved Routines</h2>
            <Link
              to="/workouts"
              className="text-xs px-3 py-1.5 rounded-lg border border-border/60 hover:bg-secondary transition-colors"
            >
              Browse all
            </Link>
          </div>
          {savedList.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p>No saved routines yet.</p>
              <Link
                to="/workouts"
                className="inline-block mt-4 bg-gradient-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90"
              >
                Find a routine
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedList.map((w) => (
                <div key={w.id} className="glass rounded-xl p-4 flex flex-col">
                  <p className="text-xs uppercase tracking-wider text-primary font-semibold">
                    {w.category}
                  </p>
                  <h3 className="font-display font-semibold mt-1">{w.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {w.duration} · {w.calories} kcal
                  </p>
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
