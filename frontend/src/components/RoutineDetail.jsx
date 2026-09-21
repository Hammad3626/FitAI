import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Play,
  Download,
  RefreshCw,
  Sparkles,
  Flame,
  Clock,
  Dumbbell,
  CheckCircle2,
  Circle,
  TrendingUp,
  Award,
  CalendarDays,
} from 'lucide-react';

function parseRoutineMarkdown(md) {
  if (!md) return { title: 'Custom Routine', metaPairs: [], warmUp: [], main: [], coolDown: [], coachNotes: '' };

  const lines = md.split(/\r?\n/);
  let title = 'Custom Routine';
  const metaPairs = [];
  const warmUp = [];
  const main = [];
  const coolDown = [];
  let warmUpDuration = '5 min';
  let coolDownDuration = '3 min';
  let coachNotes = '';

  let section = 'none';
  let inTable = false;

  for (let raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const titleMatch = line.match(/^###\s+(.+)$/);
    if (titleMatch) {
      title = titleMatch[1].trim();
      continue;
    }

    if (line.startsWith('**') && /\*\*[^*]+:\*\*/.test(line) && section === 'none') {
      const re = /\*\*([^*]+?):\*\*\s*([^·•|]+?)(?=\s*[·•|]|\s*\*\*|$)/g;
      let m;
      while ((m = re.exec(line)) !== null) {
        metaPairs.push({ label: m[1].trim(), value: m[2].trim() });
      }
      continue;
    }

    const warmMatch = line.match(/^\*\*Warm[- ]?up(?:\s*\(([^)]+)\))?\*\*/i);
    if (warmMatch) {
      section = 'warm';
      if (warmMatch[1]) warmUpDuration = warmMatch[1];
      inTable = false;
      continue;
    }

    if (/^\*\*Main(?:\s+sets?| workout)?\*\*/i.test(line)) {
      section = 'main';
      inTable = false;
      continue;
    }

    const coolMatch = line.match(/^\*\*Cool[- ]?down(?:\s*\(([^)]+)\))?\*\*/i);
    if (coolMatch) {
      section = 'cool';
      if (coolMatch[1]) coolDownDuration = coolMatch[1];
      inTable = false;
      continue;
    }

    if (/^\*\*Coach notes?:?\*\*/i.test(line)) {
      section = 'notes';
      coachNotes = line.replace(/^\*\*Coach notes?:?\*\*/i, '').trim();
      continue;
    }

    if (section === 'notes') {
      coachNotes = (coachNotes ? coachNotes + ' ' : '') + line.replace(/\*\*/g, '');
      continue;
    }

    // Table rows in main section
    if (line.startsWith('|')) {
      const cells = line.split('|').map((c) => c.trim()).filter((c) => c.length > 0);
      if (/^\|?\s*:?-+:?/.test(line)) {
        inTable = true;
        continue;
      }
      if (cells.length >= 2 && !cells[0].toLowerCase().includes('exercise')) {
        main.push({
          name: cells[0],
          sets: cells[1] || '3',
          reps: cells[2] || '10',
          rest: cells[3] || '60s',
        });
      }
      continue;
    }

    // Bullet items
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const text = line.replace(/^[-*]\s+/, '').trim();
      const parts = text.split(/[—–-]/);
      const name = parts[0]?.trim() || text;
      const detail = parts[1]?.trim() || '';

      if (section === 'warm') {
        warmUp.push({ name, detail });
      } else if (section === 'cool') {
        coolDown.push({ name, detail });
      } else if (section === 'main') {
        main.push({ name, detail, sets: '3', reps: '10-12', rest: '60s' });
      }
    }
  }

  return { title, metaPairs, warmUp, warmUpDuration, main, coolDown, coolDownDuration, coachNotes };
}

export function RoutineDetail({
  routine,
  onClose,
  onRegenerate,
  onDownload,
  onCompleteDay,
  onResetCycle,
  onJumpToDay,
  onExerciseProgress,
  dayNumber,
  totalDays,
  cycleDays = [],
  initialCompletedExercises = [],
  generating = false,
}) {
  const [completedExercises, setCompletedExercises] = useState(initialCompletedExercises);

  useEffect(() => {
    setCompletedExercises(initialCompletedExercises || []);
  }, [routine?.id, initialCompletedExercises]);

  const parsed = useMemo(() => parseRoutineMarkdown(routine?.content), [routine?.content]);

  const toggleExercise = (name) => {
    const next = completedExercises.includes(name)
      ? completedExercises.filter((x) => x !== name)
      : [...completedExercises, name];
    setCompletedExercises(next);
    if (onExerciseProgress) onExerciseProgress(next);
  };

  const totalMainCount = parsed.main.length || 1;
  const completedCount = parsed.main.filter((e) => completedExercises.includes(e.name)).length;
  const progressPercent = Math.round((completedCount / totalMainCount) * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-up overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="glass-strong rounded-2xl max-w-2xl w-full p-6 shadow-elegant my-8 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-border/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-primary font-semibold">
                Day {dayNumber || routine.dayNumber || 1} of {totalDays || routine.daysPerWeek || 3}
              </span>
              {routine.completed && (
                <span className="flex items-center gap-1 text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3 w-3" /> Completed
                </span>
              )}
            </div>
            <h2 className="font-display text-2xl font-bold mt-1">{parsed.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cycle Days Bar */}
        {cycleDays.length > 1 && (
          <div className="flex items-center gap-1.5 py-3 border-b border-border/30 overflow-x-auto">
            {cycleDays.map((cd) => (
              <button
                key={cd.day}
                onClick={() => onJumpToDay(cd.day)}
                className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shrink-0 ${
                  cd.isCurrent
                    ? 'bg-gradient-primary text-primary-foreground font-semibold'
                    : cd.completed
                    ? 'bg-secondary/70 text-emerald-300'
                    : 'glass text-muted-foreground hover:text-foreground'
                }`}
              >
                {cd.completed && <CheckCircle2 className="h-3 w-3" />}
                Day {cd.day}
              </button>
            ))}
          </div>
        )}

        {/* Routine Meta Pills */}
        <div className="flex flex-wrap gap-2 py-3 border-b border-border/30 text-xs">
          {parsed.metaPairs.map((p, i) => (
            <div key={i} className="glass px-3 py-1 rounded-full border border-border/40">
              <span className="text-muted-foreground">{p.label}:</span>{' '}
              <span className="font-medium text-foreground">{p.value}</span>
            </div>
          ))}
        </div>

        {/* Exercise Progress Bar */}
        <div className="py-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Session Checklist</span>
            <span className="font-medium text-primary">{progressPercent}% done</span>
          </div>
          <div className="h-2 bg-secondary/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Routine Content Sections */}
        <div className="space-y-5 max-h-[50vh] overflow-y-auto pr-1">
          {/* Warm-up */}
          {parsed.warmUp.length > 0 && (
            <div>
              <h3 className="font-display font-semibold text-sm flex items-center gap-2 mb-2 text-primary">
                <Clock className="h-4 w-4" /> Warm-up ({parsed.warmUpDuration})
              </h3>
              <ul className="space-y-1.5">
                {parsed.warmUp.map((w, i) => (
                  <li key={i} className="glass rounded-lg px-3 py-2 text-xs flex justify-between">
                    <span>{w.name}</span>
                    <span className="text-muted-foreground">{w.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Main Sets with Checkboxes */}
          <div>
            <h3 className="font-display font-semibold text-sm flex items-center gap-2 mb-2 text-primary">
              <Dumbbell className="h-4 w-4" /> Main Sets (Tap to track completion)
            </h3>
            <div className="space-y-2">
              {parsed.main.map((ex, i) => {
                const isChecked = completedExercises.includes(ex.name);
                return (
                  <div
                    key={i}
                    onClick={() => toggleExercise(ex.name)}
                    className={`glass rounded-xl p-3 flex items-center justify-between cursor-pointer border transition-all ${
                      isChecked
                        ? 'border-emerald-500/40 bg-emerald-950/20'
                        : 'border-border/50 hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isChecked ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                      <div>
                        <p className={`text-sm font-semibold ${isChecked ? 'line-through text-muted-foreground' : ''}`}>
                          {ex.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {ex.sets ? `${ex.sets} sets` : ''} · {ex.reps ? `${ex.reps} reps` : ''} · {ex.rest ? `${ex.rest} rest` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cool-down */}
          {parsed.coolDown.length > 0 && (
            <div>
              <h3 className="font-display font-semibold text-sm flex items-center gap-2 mb-2 text-primary">
                <Flame className="h-4 w-4" /> Cool-down ({parsed.coolDownDuration})
              </h3>
              <ul className="space-y-1.5">
                {parsed.coolDown.map((c, i) => (
                  <li key={i} className="glass rounded-lg px-3 py-2 text-xs flex justify-between">
                    <span>{c.name}</span>
                    <span className="text-muted-foreground">{c.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Coach Notes */}
          {parsed.coachNotes && (
            <div className="glass rounded-xl p-3 border border-primary/20 bg-primary/5">
              <p className="text-xs font-semibold text-primary mb-1">Coach Note</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{parsed.coachNotes}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-5 pt-4 border-t border-border/40 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <button
              onClick={onDownload}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-border/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Print / Save
            </button>
            <button
              onClick={onRegenerate}
              disabled={generating}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-border/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${generating ? 'animate-spin' : ''}`} /> Regenerate
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onCompleteDay(dayNumber || routine.dayNumber || 1)}
              disabled={generating}
              className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground hover:opacity-90 font-medium shadow-glow transition-opacity disabled:opacity-50"
            >
              <Award className="h-3.5 w-3.5" />
              {dayNumber >= (totalDays || 3) ? 'Complete Cycle' : 'Complete & Build Next Day'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
