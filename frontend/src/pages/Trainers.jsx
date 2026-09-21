import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Award,
  Search,
  MapPin,
  Clock,
  Dumbbell,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Users,
} from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';

export function Trainers() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');

  // Quick Request Modal State
  const [requestModalTrainer, setRequestModalTrainer] = useState(null);
  const [requestGoal, setRequestGoal] = useState('');
  const [requestLevel, setRequestLevel] = useState('Beginner');
  const [requestMessage, setRequestMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get('/trainers')
      .then((data) => {
        if (Array.isArray(data)) setTrainers(data);
      })
      .catch((err) => {
        console.error('Failed to load trainers:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const specialties = [
    'All',
    ...Array.from(new Set(trainers.map((t) => t.specialization).filter(Boolean))),
  ];

  const filtered = trainers.filter((t) => {
    const matchesSearch =
      (t.displayName || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.specialization || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.bio || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.location || '').toLowerCase().includes(search.toLowerCase());

    const matchesSpecialty =
      selectedSpecialty === 'All' || t.specialization === selectedSpecialty;

    return matchesSearch && matchesSpecialty;
  });

  const handleOpenRequest = (trainer) => {
    if (!user) {
      toast.error('Please sign in to request training');
      navigate('/auth');
      return;
    }
    if (user.role === 'trainer') {
      toast.error('Trainers cannot request training from other trainers');
      return;
    }
    setRequestModalTrainer(trainer);
    setRequestGoal('Build muscle and improve fitness');
    setRequestLevel('Beginner');
    setRequestMessage('');
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!requestModalTrainer) return;

    setSendingRequest(true);
    try {
      const res = await api.post(`/trainers/${requestModalTrainer._id}/request`, {
        goal: requestGoal,
        experienceLevel: requestLevel,
        message: requestMessage,
      });
      toast.success(res.message || 'Request sent successfully!');
      setRequestModalTrainer(null);
    } catch (err) {
      toast.error(err.message || 'Failed to send request');
    } finally {
      setSendingRequest(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <header className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1.5 text-xs font-semibold text-primary mb-3">
          <Award className="h-4 w-4" /> Certified Fitness Coaches
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold">
          Find Your Perfect <span className="gradient-text">Trainer</span>
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          Connect with certified coaches for 1-on-1 personalized guidance, structured workout programs, and custom nutrition plans.
        </p>
      </header>

      {/* Search & Filter Bar */}
      <div className="glass-strong rounded-2xl p-4 sm:p-5 mb-10 max-w-4xl mx-auto shadow-elegant">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by trainer name, specialty, or city..."
              className="w-full bg-input/60 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring border border-border/40"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {specialties.slice(0, 5).map((spec) => (
              <button
                key={spec}
                onClick={() => setSelectedSpecialty(spec)}
                className={`text-xs px-3.5 py-2 rounded-xl whitespace-nowrap transition-colors border ${
                  selectedSpecialty === spec
                    ? 'bg-primary text-primary-foreground border-primary font-medium shadow-sm'
                    : 'glass border-border/60 text-muted-foreground hover:text-foreground'
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Trainers Listing */}
      {loading ? (
        <div className="text-center py-20 text-muted-foreground text-sm">
          Loading certified trainers from database...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 glass-strong rounded-3xl max-w-xl mx-auto p-8 shadow-elegant">
          <Award className="h-12 w-12 text-primary mx-auto mb-4 opacity-70" />
          <h2 className="font-display text-2xl font-bold">No Trainers Found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {search
              ? 'No registered trainers matched your search filters.'
              : 'There are currently no trainers registered in the system.'}
          </p>
          <div className="mt-6">
            <Link
              to="/trainer/signup"
              className="inline-flex items-center gap-2 bg-gradient-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm shadow-glow hover:opacity-90"
            >
              Become the First Coach <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((trainer) => (
            <article
              key={trainer._id}
              className="glass-strong rounded-3xl p-6 flex flex-col justify-between hover:shadow-glow hover:-translate-y-1 transition-all duration-300"
            >
              <div>
                {/* Profile Header */}
                <div className="flex items-start gap-4 mb-4">
                  {trainer.profileImage || trainer.avatarUrl ? (
                    <img
                      src={trainer.profileImage || trainer.avatarUrl}
                      alt={trainer.displayName}
                      className="h-16 w-16 rounded-2xl object-cover border border-primary/30 shadow-glow shrink-0"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center font-display font-bold text-xl text-primary-foreground shadow-glow shrink-0">
                      {trainer.displayName?.[0] || 'T'}
                    </div>
                  )}

                  <div className="overflow-hidden">
                    <span className="text-[10px] font-semibold text-primary uppercase tracking-wider block">
                      {trainer.specialization || 'Fitness Coach'}
                    </span>
                    <h2 className="font-display text-xl font-bold truncate mt-0.5">
                      {trainer.displayName}
                    </h2>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" /> {trainer.experience || 'Experienced'}
                    </p>
                  </div>
                </div>

                {/* Location & Availability Badges */}
                <div className="flex flex-wrap items-center gap-1.5 mb-3 text-[11px]">
                  {trainer.location && (
                    <span className="glass border border-border/60 px-2.5 py-0.5 rounded-full text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-primary" /> {trainer.location}
                    </span>
                  )}
                  {trainer.availability && (
                    <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-medium">
                      ● {trainer.availability}
                    </span>
                  )}
                </div>

                {/* Bio snippet */}
                {trainer.bio && (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mb-4">
                    {trainer.bio}
                  </p>
                )}

                {/* Expertise tags */}
                {trainer.expertise && trainer.expertise.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {trainer.expertise.slice(0, 3).map((exp, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-secondary/80 text-foreground"
                      >
                        {exp}
                      </span>
                    ))}
                    {trainer.expertise.length > 3 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md text-muted-foreground">
                        +{trainer.expertise.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 border-t border-border/40 mt-2 flex items-center gap-2">
                <Link
                  to={`/trainers/${trainer._id}`}
                  className="flex-1 py-2 rounded-xl glass border border-border/60 hover:bg-secondary text-xs font-semibold text-center transition-colors"
                >
                  View Profile
                </Link>
                <button
                  onClick={() => handleOpenRequest(trainer)}
                  className="flex-1 py-2 rounded-xl bg-gradient-primary text-primary-foreground hover:opacity-90 text-xs font-semibold shadow-glow transition-opacity text-center"
                >
                  Request Coaching
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Become a Coach Banner */}
      <section className="mt-20 glass-strong rounded-3xl p-8 lg:p-12 text-center max-w-4xl mx-auto shadow-elegant">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow mb-4">
          <Award className="h-6 w-6 text-primary-foreground" />
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold">
          Are you a Certified Personal Trainer or Coach?
        </h2>
        <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto">
          Sign up today to create your professional profile, accept client requests, and deliver tailored workout & nutrition programs through our modern platform.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/trainer/signup"
            className="bg-gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm shadow-glow hover:opacity-90 transition-opacity"
          >
            Register as a Coach
          </Link>
          <Link
            to="/trainer/signin"
            className="glass border border-border/60 hover:bg-secondary px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
          >
            Coach Sign In
          </Link>
        </div>
      </section>

      {/* Quick Request Modal */}
      {requestModalTrainer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={() => setRequestModalTrainer(null)}
        >
          <div
            className="glass-strong rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-elegant"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-border/40 mb-4">
              <div>
                <p className="text-xs font-semibold text-primary uppercase">Training Application</p>
                <h3 className="font-display text-xl font-bold">
                  Request Coaching with {requestModalTrainer.displayName}
                </h3>
              </div>
              <button
                onClick={() => setRequestModalTrainer(null)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Your Primary Fitness Goal *
                </label>
                <input
                  type="text"
                  required
                  value={requestGoal}
                  onChange={(e) => setRequestGoal(e.target.value)}
                  placeholder="e.g. Lose 8kg and build strength"
                  className="w-full bg-input/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring border border-border/40"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Your Experience Level
                </label>
                <select
                  value={requestLevel}
                  onChange={(e) => setRequestLevel(e.target.value)}
                  className="w-full bg-input/60 rounded-xl px-3 py-2.5 text-sm outline-none border border-border/40 text-foreground"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Message for Coach (Injuries, schedule preferences, etc.)
                </label>
                <textarea
                  rows={3}
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="Tell the trainer about your availability, training background, or any injuries..."
                  className="w-full bg-input/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-border/40 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setRequestModalTrainer(null)}
                  className="px-4 py-2.5 rounded-xl border border-border text-xs hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingRequest}
                  className="px-6 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground text-xs font-semibold shadow-glow hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {sendingRequest ? 'Sending Request...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
