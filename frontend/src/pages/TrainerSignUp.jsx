import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dumbbell, Award, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';

const COMMON_EXPERTISE = [
  'Weight Loss & Fat Burn',
  'Hypertrophy & Muscle Gain',
  'Strength & Conditioning',
  'HIIT & Cardio',
  'Mobility & Flexibility',
  'Bodybuilding',
  'Functional Fitness',
  'Injury Rehabilitation',
];

const COMMON_TRAINING_TYPES = [
  '1-on-1 Online Coaching',
  'Custom Workout Plans',
  'Nutrition & Macro Guidance',
  'Weekly Progress Check-ins',
  'Video Form Reviews',
  'Group Training',
];

export function TrainerSignUp() {
  const navigate = useNavigate();
  const { user, loading, trainerRegister, isTrainer } = useAuth();
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form state
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    profileImage: '',
    specialization: 'Hypertrophy & Strength',
    experience: '3+ years',
    certifications: '',
    bio: '',
    location: '',
    availability: 'Accepting new clients',
    hourlyRate: '',
    expertise: ['Hypertrophy & Muscle Gain', 'Strength & Conditioning'],
    trainingTypes: ['1-on-1 Online Coaching', 'Custom Workout Plans'],
  });

  useEffect(() => {
    if (!loading && user) {
      if (isTrainer) {
        navigate('/trainer/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, loading, isTrainer, navigate]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrorMsg('');
  };

  const toggleExpertise = (tag) => {
    setForm((prev) => {
      const exists = prev.expertise.includes(tag);
      return {
        ...prev,
        expertise: exists ? prev.expertise.filter((t) => t !== tag) : [...prev.expertise, tag],
      };
    });
  };

  const toggleTrainingType = (type) => {
    setForm((prev) => {
      const exists = prev.trainingTypes.includes(type);
      return {
        ...prev,
        trainingTypes: exists
          ? prev.trainingTypes.filter((t) => t !== type)
          : [...prev.trainingTypes, type],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Form Validations
    if (!form.name.trim()) {
      setErrorMsg('Full name is required');
      toast.error('Full name is required');
      return;
    }

    if (!form.email.trim()) {
      setErrorMsg('Email is required');
      toast.error('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      setErrorMsg('Please enter a valid email address');
      toast.error('Please enter a valid email address');
      return;
    }

    if (!form.password) {
      setErrorMsg('Password is required');
      toast.error('Password is required');
      return;
    }

    if (form.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long');
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setErrorMsg('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }

    if (!form.specialization.trim()) {
      setErrorMsg('Please specify your training specialization');
      toast.error('Please specify your training specialization');
      return;
    }

    setBusy(true);

    try {
      await trainerRegister({
        name: form.name.trim(),
        displayName: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        phone: form.phone.trim(),
        profileImage: form.profileImage.trim(),
        specialization: form.specialization.trim(),
        experience: form.experience.trim(),
        certifications: form.certifications.trim(),
        bio: form.bio.trim(),
        expertise: form.expertise,
        trainingTypes: form.trainingTypes,
        location: form.location.trim() || 'Online / Remote',
        availability: form.availability.trim(),
        hourlyRate: Number(form.hourlyRate) || 0,
      });

      toast.success('Welcome to FitAI Coach Network! Your trainer dashboard is ready.');
      navigate('/trainer/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
      toast.error(err.message || 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Brand Header */}
      <div className="text-center mb-10">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow mb-4">
          <Award className="h-7 w-7 text-primary-foreground" />
        </div>
        <span className="inline-block px-3 py-1 mb-2 text-xs font-semibold rounded-full bg-primary/20 text-primary border border-primary/30">
          Coach & Trainer Registration
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-bold">
          Join the <span className="gradient-text">FitAI Trainer Network</span>
        </h1>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
          Create your professional coaching profile, connect with eager fitness clients, and provide personalized workout and nutrition plans.
        </p>
      </div>

      {/* Main Registration Card */}
      <div className="glass-strong rounded-3xl p-6 sm:p-10 shadow-elegant">
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/15 border border-destructive/30 text-rose-300 text-sm flex items-center gap-2">
            <span className="font-semibold">Error:</span> {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Account Credentials */}
          <div>
            <h2 className="text-base font-semibold font-display text-foreground mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> 1. Account Credentials
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full bg-input/60 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-ring border border-border/40 text-foreground text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="coach.sarah@example.com"
                  className="w-full bg-input/60 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-ring border border-border/40 text-foreground text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Password * (Min 6 chars)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-input/60 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-ring border border-border/40 text-foreground text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-input/60 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-ring border border-border/40 text-foreground text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="w-full bg-input/60 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-ring border border-border/40 text-foreground text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Profile Picture URL
                </label>
                <input
                  type="url"
                  value={form.profileImage}
                  onChange={(e) => handleChange('profileImage', e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full bg-input/60 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-ring border border-border/40 text-foreground text-sm"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-border/40" />

          {/* Section 2: Professional Background */}
          <div>
            <h2 className="text-base font-semibold font-display text-foreground mb-4 flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" /> 2. Professional Qualifications
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Primary Specialization *
                </label>
                <input
                  type="text"
                  required
                  value={form.specialization}
                  onChange={(e) => handleChange('specialization', e.target.value)}
                  placeholder="e.g. Hypertrophy, Fat Loss, Powerlifting"
                  className="w-full bg-input/60 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-ring border border-border/40 text-foreground text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Experience *
                </label>
                <input
                  type="text"
                  required
                  value={form.experience}
                  onChange={(e) => handleChange('experience', e.target.value)}
                  placeholder="e.g. 5+ Years"
                  className="w-full bg-input/60 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-ring border border-border/40 text-foreground text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Certifications
                </label>
                <input
                  type="text"
                  value={form.certifications}
                  onChange={(e) => handleChange('certifications', e.target.value)}
                  placeholder="e.g. NASM-CPT, CSCS, Precision Nutrition L1"
                  className="w-full bg-input/60 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-ring border border-border/40 text-foreground text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Hourly / Session Rate ($)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.hourlyRate}
                  onChange={(e) => handleChange('hourlyRate', e.target.value)}
                  placeholder="50"
                  className="w-full bg-input/60 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-ring border border-border/40 text-foreground text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="e.g. Los Angeles, CA / Remote"
                  className="w-full bg-input/60 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-ring border border-border/40 text-foreground text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Availability Status
                </label>
                <input
                  type="text"
                  value={form.availability}
                  onChange={(e) => handleChange('availability', e.target.value)}
                  placeholder="e.g. Accepting 3 new clients"
                  className="w-full bg-input/60 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-ring border border-border/40 text-foreground text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Bio / About Yourself
                </label>
                <textarea
                  rows={3}
                  value={form.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  placeholder="Share your coaching philosophy, who you love to work with, and what clients can expect..."
                  className="w-full bg-input/60 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-ring border border-border/40 text-foreground text-sm resize-none"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-border/40" />

          {/* Section 3: Expertise & Training Types */}
          <div>
            <h2 className="text-base font-semibold font-display text-foreground mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" /> 3. Fitness Expertise & Offerings
            </h2>

            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Select your areas of fitness expertise:
              </p>
              <div className="flex flex-wrap gap-2">
                {COMMON_EXPERTISE.map((exp) => {
                  const selected = form.expertise.includes(exp);
                  return (
                    <button
                      type="button"
                      key={exp}
                      onClick={() => toggleExpertise(exp)}
                      className={`text-xs px-3 py-1.5 rounded-full transition-colors border ${
                        selected
                          ? 'bg-primary text-primary-foreground border-primary font-medium shadow-sm'
                          : 'glass border-border/60 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {selected ? '✓ ' : '+ '} {exp}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Select your training service types:
              </p>
              <div className="flex flex-wrap gap-2">
                {COMMON_TRAINING_TYPES.map((type) => {
                  const selected = form.trainingTypes.includes(type);
                  return (
                    <button
                      type="button"
                      key={type}
                      onClick={() => toggleTrainingType(type)}
                      className={`text-xs px-3 py-1.5 rounded-full transition-colors border ${
                        selected
                          ? 'bg-primary text-primary-foreground border-primary font-medium shadow-sm'
                          : 'glass border-border/60 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {selected ? '✓ ' : '+ '} {type}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 bg-gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold shadow-glow hover:opacity-90 transition-opacity text-base disabled:opacity-50"
            >
              {busy ? 'Creating Coach Account...' : 'Complete Registration & Open Dashboard'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>

        {/* Alternate Navigation */}
        <div className="mt-8 pt-6 border-t border-border/40 text-center space-y-2 text-xs text-muted-foreground">
          <p>
            Already have a trainer account?{' '}
            <Link to="/trainer/signin" className="text-primary font-medium hover:underline">
              Trainer Sign In
            </Link>
          </p>
          <p>
            Looking for regular member sign in?{' '}
            <Link to="/auth" className="text-muted-foreground hover:text-foreground underline">
              Member Sign In / Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
