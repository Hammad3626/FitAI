import React, { useState } from 'react';
import { Calculator } from 'lucide-react';
import { nutritionTips } from '../data/fitnessData';

export function Nutrition() {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bmi, setBmi] = useState(null);

  const calc = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100;
    if (!w || !h) return;
    setBmi(+(w / (h * h)).toFixed(1));
  };

  const bmiCategory =
    bmi == null
      ? null
      : bmi < 18.5
      ? { label: 'Underweight', color: 'text-sky-300' }
      : bmi < 25
      ? { label: 'Healthy Weight', color: 'text-emerald-300' }
      : bmi < 30
      ? { label: 'Overweight', color: 'text-amber-300' }
      : { label: 'Obese', color: 'text-rose-300' };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <header className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="font-display text-4xl sm:text-5xl font-bold">
          Nutrition & <span className="gradient-text">Diet</span>
        </h1>
        <p className="mt-4 text-muted-foreground">
          Practical nutrition guidance — no fads, no fluff.
        </p>
      </header>

      {/* Nutrition Tips Grid */}
      <div className="grid lg:grid-cols-3 gap-6 mb-16">
        {nutritionTips.map((t, i) => (
          <article
            key={t.id}
            className="glass-strong rounded-2xl p-6 hover:shadow-glow hover:-translate-y-1 transition-all animate-fade-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">{t.emoji}</div>
              <div>
                <p className="text-xs uppercase tracking-wider text-primary font-semibold">
                  {t.category}
                </p>
                <h3 className="mt-1 font-display text-lg font-semibold">{t.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t.body}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* BMI Calculator Section */}
      <section className="glass-strong rounded-3xl p-8 lg:p-12 max-w-3xl mx-auto shadow-elegant">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary">
            <Calculator className="h-5 w-5 text-primary-foreground" />
          </div>
          <h2 className="font-display text-2xl font-bold">Quick BMI calculator</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground">Weight (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="mt-1 w-full bg-input/60 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-ring border border-border/40"
              placeholder="70"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Height (cm)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="mt-1 w-full bg-input/60 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-ring border border-border/40"
              placeholder="175"
            />
          </div>
        </div>

        <button
          onClick={calc}
          className="mt-5 bg-gradient-primary text-primary-foreground hover:opacity-90 px-6 py-3 rounded-xl font-semibold shadow-glow transition-opacity"
        >
          Calculate BMI
        </button>

        {bmi !== null && bmiCategory && (
          <div className="mt-6 glass rounded-xl p-5 flex items-center justify-between animate-fade-up">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Your BMI</p>
              <p className="font-display text-3xl font-bold mt-1">{bmi}</p>
            </div>
            <p className={`font-semibold text-lg ${bmiCategory.color}`}>{bmiCategory.label}</p>
          </div>
        )}
      </section>
    </div>
  );
}
