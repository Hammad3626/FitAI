import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Award,
  MapPin,
  Clock,
  Phone,
  Mail,
  CheckCircle,
  Dumbbell,
  ArrowLeft,
  DollarSign,
  Calendar,
  Send,
} from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';

export function TrainerProfilePublic() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trainer, setTrainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Request form modal state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [goal, setGoal] = useState('Build muscle and gain strength');
  const [experienceLevel, setExperienceLevel] = useState('Beginner');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/trainers/${id}`)
      .then((data) => {
        if (data) setTrainer(data);
        else setError('Trainer not found');
      })
      .catch((err) => {
        console.error(err);
        setError('Could not find this trainer.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleOpenRequest = () => {
    if (!user) {
      toast.error('Please sign in to request training');
      navigate('/auth');
      return;
    }
    if (user.role === 'trainer') {
      toast.error('Trainers cannot request training from other coaches');
      return;
    }
    setShowRequestModal(true);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!goal.trim()) {
      toast.error('Please state your fitness goal');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/trainers/${id}/request`, {
        goal: goal.trim(),
        experienceLevel,
        message: message.trim(),
      });
      toast.success(res.message || 'Training request submitted successfully!');
      setShowRequestModal(false);
    } catch (err) {
      toast.error(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center text-muted-foreground text-sm">
        Loading coach profile...
      </div>
    );
  }

  if (error || !trainer) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h2 className="font-display text-2xl font-bold mb-3">Trainer Not Found</h2>
        <p className="text-sm text-muted-foreground mb-6">
          The trainer profile you are trying to view does not exist or has been removed.
        </p>
        <Link
          to="/trainers"
          className="bg-gradient-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-xs shadow-glow hover:opacity-90 inline-block"
        >
          ← Browse All Trainers
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Back Link */}
      <div className="mb-6">
        <Link
          to="/trainers"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to all coaches
        </Link>
      </div>

      {/* Hero Header Card */}
      <div className="glass-strong rounded-3xl p-6 sm:p-10 shadow-elegant mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {trainer.profileImage || trainer.avatarUrl ? (
            <img
              src={trainer.profileImage || trainer.avatarUrl}
              alt={trainer.displayName}
              className="h-28 w-28 rounded-3xl object-cover border-2 border-primary/40 shadow-glow shrink-0"
            />
          ) : (
            <div className="h-28 w-28 rounded-3xl bg-gradient-primary flex items-center justify-center font-display font-bold text-4xl text-primary-foreground shadow-glow shrink-0">
              {trainer.displayName?.[0] || 'T'}
            </div>
          )}

          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold mb-2">
              <Award className="h-3.5 w-3.5" /> Certified Fitness Coach
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold">{trainer.displayName}</h1>
            <p className="text-base text-primary font-medium mt-1">{trainer.specialization}</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-primary" /> {trainer.experience || 'Experienced'}
              </span>
              {trainer.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> {trainer.location}
                </span>
              )}
              {trainer.hourlyRate > 0 && (
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  ${trainer.hourlyRate} / hour
                </span>
              )}
            </div>

            {trainer.availability && (
              <div className="mt-3">
                <span className="inline-block bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs px-3 py-1 rounded-full font-medium">
                  ● {trainer.availability}
                </span>
              </div>
            )}
          </div>

          <div className="sm:self-center shrink-0">
            <button
              onClick={handleOpenRequest}
              className="w-full sm:w-auto bg-gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm shadow-glow hover:opacity-90 transition-opacity"
            >
              Request Training
            </button>
          </div>
        </div>
      </div>

      {/* Profile Details Sections */}
      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="md:col-span-2 space-y-8">
          {/* About / Bio */}
          <div className="glass-strong rounded-3xl p-6 sm:p-8 shadow-elegant">
            <h2 className="font-display text-xl font-bold mb-4">About Coach {trainer.displayName}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {trainer.bio || 'Coach has not added a detailed biography yet.'}
            </p>
          </div>

          {/* Training Offerings */}
          {trainer.trainingTypes && trainer.trainingTypes.length > 0 && (
            <div className="glass-strong rounded-3xl p-6 sm:p-8 shadow-elegant">
              <h2 className="font-display text-xl font-bold mb-4">Training Services & Formats</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {trainer.trainingTypes.map((type, i) => (
                  <div key={i} className="flex items-center gap-2.5 glass rounded-xl p-3 text-xs font-medium">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    <span>{type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fitness Expertise */}
          {trainer.expertise && trainer.expertise.length > 0 && (
            <div className="glass-strong rounded-3xl p-6 sm:p-8 shadow-elegant">
              <h2 className="font-display text-xl font-bold mb-4">Fitness & Exercise Expertise</h2>
              <div className="flex flex-wrap gap-2">
                {trainer.expertise.map((exp, i) => (
                  <span
                    key={i}
                    className="glass border border-border/60 text-xs px-3.5 py-1.5 rounded-xl font-medium"
                  >
                    {exp}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="glass-strong rounded-3xl p-6 shadow-elegant space-y-4">
            <h3 className="font-display font-bold text-base">Trainer Credentials</h3>

            <div className="text-xs space-y-3">
              <div>
                <p className="text-muted-foreground mb-1">Certifications:</p>
                <p className="font-semibold text-foreground">
                  {trainer.certifications || 'Verified Fitness Professional'}
                </p>
              </div>

              <div>
                <p className="text-muted-foreground mb-1">Specialization:</p>
                <p className="font-semibold text-foreground">{trainer.specialization}</p>
              </div>

              <div>
                <p className="text-muted-foreground mb-1">Experience:</p>
                <p className="font-semibold text-foreground">{trainer.experience || '1+ years'}</p>
              </div>

              <div>
                <p className="text-muted-foreground mb-1">Location / Training Venue:</p>
                <p className="font-semibold text-foreground">{trainer.location || 'Remote / Online'}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-border/40">
              <button
                onClick={handleOpenRequest}
                className="w-full bg-gradient-primary text-primary-foreground py-2.5 rounded-xl font-semibold text-xs shadow-glow hover:opacity-90 transition-opacity"
              >
                Apply for Coaching
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={() => setShowRequestModal(false)}
        >
          <div
            className="glass-strong rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-elegant"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-border/40 mb-4">
              <div>
                <p className="text-xs font-semibold text-primary uppercase">Training Application</p>
                <h3 className="font-display text-xl font-bold">Request Coach {trainer.displayName}</h3>
              </div>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Primary Fitness Goal *
                </label>
                <input
                  type="text"
                  required
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g. 10kg fat loss, build shoulder hypertrophy"
                  className="w-full bg-input/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring border border-border/40"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Your Current Experience Level
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full bg-input/60 rounded-xl px-3 py-2.5 text-sm outline-none border border-border/40 text-foreground"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Message / Availability / Notes
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Mention your preferred days, gym access, or injuries..."
                  className="w-full bg-input/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-border/40 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-border text-xs hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground text-xs font-semibold shadow-glow hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {submitting ? 'Submitting...' : 'Submit Training Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
