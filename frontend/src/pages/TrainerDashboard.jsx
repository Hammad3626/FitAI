import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  UserCheck,
  Clock,
  Dumbbell,
  Utensils,
  MessageSquare,
  Award,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  Send,
  Sparkles,
  Search,
  ChevronRight,
  User,
  Phone,
  MapPin,
  DollarSign,
  Calendar,
  Layers,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { toast } from '../components/Toast';

export function TrainerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, isTrainer, updateUserData } = useAuth();

  // Active tab state: 'overview' | 'clients' | 'requests' | 'workouts' | 'nutrition' | 'messages' | 'profile'
  const [activeTab, setActiveTab] = useState('overview');

  // Dashboard Data State
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    pendingRequests: 0,
    workoutPlansCount: 0,
    nutritionPlansCount: 0,
    unreadMessages: 0,
    profileCompletion: 0,
  });

  const [clients, setClients] = useState([]);
  const [requests, setRequests] = useState([]);
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [nutritionPlans, setNutritionPlans] = useState([]);

  // Messaging State
  const [selectedClient, setSelectedClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Modals & Forms State
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [workoutForm, setWorkoutForm] = useState({
    title: '',
    description: '',
    clientId: '',
    goal: 'Hypertrophy',
    duration: '4 weeks',
    schedule: '3 days / week',
    notes: '',
    exercises: [{ name: '', sets: '3', reps: '10', restTime: '60s', notes: '' }],
  });

  const [showNutritionModal, setShowNutritionModal] = useState(false);
  const [editingNutrition, setEditingNutrition] = useState(null);
  const [nutritionForm, setNutritionForm] = useState({
    title: '',
    clientId: '',
    dailyCalories: 2200,
    proteinGrams: 160,
    carbsGrams: 220,
    fatsGrams: 65,
    notes: '',
    meals: [{ mealName: 'Breakfast', items: 'Oatmeal, 3 eggs, blueberries', calories: 550 }],
  });

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    phone: '',
    profileImage: '',
    specialization: '',
    experience: '',
    certifications: '',
    bio: '',
    location: '',
    availability: '',
    hourlyRate: 0,
    expertise: [],
    trainingTypes: [],
  });

  // Check auth & role protection
  useEffect(() => {
    if (!loading) {
      if (!user) {
        toast.error('Please sign in as a trainer to access this page');
        navigate('/trainer/signin');
      } else if (!isTrainer) {
        toast.error('Access restricted to certified trainers');
        navigate('/dashboard');
      }
    }
  }, [user, loading, isTrainer, navigate]);

  // Sync tab with URL path if applicable
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/trainer/clients')) setActiveTab('clients');
    else if (path.includes('/trainer/requests')) setActiveTab('requests');
    else if (path.includes('/trainer/workouts')) setActiveTab('workouts');
    else if (path.includes('/trainer/nutrition')) setActiveTab('nutrition');
    else if (path.includes('/trainer/messages')) setActiveTab('messages');
    else if (path.includes('/trainer/profile')) setActiveTab('profile');
    else setActiveTab('overview');
  }, [location.pathname]);

  // Load all initial data from MongoDB
  const loadDashboardData = async () => {
    if (!user || user.role !== 'trainer') return;

    try {
      const [statsData, clientsData, requestsData, workoutsData, nutritionData] =
        await Promise.all([
          api.get('/trainers/dashboard/stats').catch(() => null),
          api.get('/trainers/clients').catch(() => []),
          api.get('/trainers/requests').catch(() => []),
          api.get('/trainers/workouts').catch(() => []),
          api.get('/trainers/nutrition').catch(() => []),
        ]);

      if (statsData) setStats(statsData);
      if (Array.isArray(clientsData)) {
        setClients(clientsData);
        if (clientsData.length > 0 && !selectedClient) {
          setSelectedClient(clientsData[0].client);
        }
      }
      if (Array.isArray(requestsData)) setRequests(requestsData);
      if (Array.isArray(workoutsData)) setWorkoutPlans(workoutsData);
      if (Array.isArray(nutritionData)) setNutritionPlans(nutritionData);

      // Populate profile form from user
      setProfileForm({
        displayName: user.displayName || '',
        phone: user.phone || '',
        profileImage: user.profileImage || user.avatarUrl || '',
        specialization: user.specialization || '',
        experience: user.experience || '',
        certifications: user.certifications || '',
        bio: user.bio || '',
        location: user.location || '',
        availability: user.availability || '',
        hourlyRate: user.hourlyRate || 0,
        expertise: user.expertise || [],
        trainingTypes: user.trainingTypes || [],
      });
    } catch (err) {
      console.error('Failed to load trainer dashboard data:', err);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  // Load messages when selectedClient changes
  useEffect(() => {
    if (selectedClient?._id && activeTab === 'messages') {
      setLoadingMessages(true);
      api
        .get(`/trainers/messages/${selectedClient._id}`)
        .then((data) => {
          if (Array.isArray(data)) setMessages(data);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoadingMessages(false));
    }
  }, [selectedClient, activeTab]);

  // ================= ACTION HANDLERS =================

  const handleAcceptRequest = async (requestId) => {
    try {
      const res = await api.post(`/trainers/requests/${requestId}/accept`);
      toast.success(res.message || 'Request accepted! User is now your client.');
      loadDashboardData();
    } catch (err) {
      toast.error(err.message || 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await api.post(`/trainers/requests/${requestId}/reject`);
      toast.success('Request rejected');
      loadDashboardData();
    } catch (err) {
      toast.error(err.message || 'Failed to reject request');
    }
  };

  // Workout Plan Submission
  const handleSaveWorkoutPlan = async (e) => {
    e.preventDefault();
    if (!workoutForm.title.trim()) {
      toast.error('Workout plan title is required');
      return;
    }

    try {
      if (editingWorkout) {
        await api.put(`/trainers/workouts/${editingWorkout._id}`, workoutForm);
        toast.success('Workout plan updated successfully');
      } else {
        await api.post('/trainers/workouts', workoutForm);
        toast.success('Workout plan created & assigned');
      }
      setShowWorkoutModal(false);
      setEditingWorkout(null);
      loadDashboardData();
    } catch (err) {
      toast.error(err.message || 'Failed to save workout plan');
    }
  };

  const handleDeleteWorkout = async (id) => {
    if (!window.confirm('Are you sure you want to delete this workout plan?')) return;
    try {
      await api.delete(`/trainers/workouts/${id}`);
      toast.success('Workout plan removed');
      loadDashboardData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete workout plan');
    }
  };

  // Nutrition Plan Submission
  const handleSaveNutritionPlan = async (e) => {
    e.preventDefault();
    if (!nutritionForm.title.trim()) {
      toast.error('Nutrition plan title is required');
      return;
    }

    try {
      if (editingNutrition) {
        await api.put(`/trainers/nutrition/${editingNutrition._id}`, nutritionForm);
        toast.success('Nutrition plan updated');
      } else {
        await api.post('/trainers/nutrition', nutritionForm);
        toast.success('Nutrition plan created & assigned');
      }
      setShowNutritionModal(false);
      setEditingNutrition(null);
      loadDashboardData();
    } catch (err) {
      toast.error(err.message || 'Failed to save nutrition plan');
    }
  };

  const handleDeleteNutrition = async (id) => {
    if (!window.confirm('Are you sure you want to delete this nutrition plan?')) return;
    try {
      await api.delete(`/trainers/nutrition/${id}`);
      toast.success('Nutrition plan removed');
      loadDashboardData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete nutrition plan');
    }
  };

  // Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedClient?._id) return;

    const content = messageInput.trim();
    setMessageInput('');

    try {
      const newMsg = await api.post(`/trainers/messages/${selectedClient._id}`, { content });
      setMessages((prev) => [...prev, newMsg]);
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  // Save Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/trainers/profile', profileForm);
      toast.success('Trainer profile updated successfully!');
      if (res.trainer) {
        updateUserData(res.trainer);
      }
      loadDashboardData();
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    }
  };

  if (loading || !user || !isTrainer) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center text-muted-foreground">
        Loading your trainer dashboard...
      </div>
    );
  }

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 pb-6 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <Award className="h-4 w-4" /> Certified Trainer Portal
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold">
            Coach <span className="gradient-text">{user.displayName || 'Trainer'}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.specialization || 'Fitness Trainer'} · {user.location || 'Remote'} · {user.availability}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setEditingWorkout(null);
              setWorkoutForm({
                title: '',
                description: '',
                clientId: clients[0]?.client?._id || '',
                goal: 'Hypertrophy',
                duration: '4 weeks',
                schedule: '3 days / week',
                notes: '',
                exercises: [{ name: '', sets: '3', reps: '10', restTime: '60s', notes: '' }],
              });
              setShowWorkoutModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-primary text-primary-foreground text-xs font-semibold shadow-glow hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> New Workout Plan
          </button>

          <button
            onClick={() => {
              setEditingNutrition(null);
              setNutritionForm({
                title: '',
                clientId: clients[0]?.client?._id || '',
                dailyCalories: 2200,
                proteinGrams: 160,
                carbsGrams: 220,
                fatsGrams: 65,
                notes: '',
                meals: [{ mealName: 'Breakfast', items: 'Oatmeal, 3 eggs, blueberries', calories: 550 }],
              });
              setShowNutritionModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl glass border border-border/60 hover:bg-secondary text-xs font-semibold transition-colors"
          >
            <Utensils className="h-4 w-4 text-primary" /> New Nutrition Plan
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1 overflow-x-auto pb-3 mb-8 border-b border-border/40 scrollbar-none">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'clients', label: `My Clients (${clients.length})`, icon: Users },
          {
            id: 'requests',
            label: `Requests ${pendingCount > 0 ? `(${pendingCount})` : ''}`,
            icon: Clock,
            badge: pendingCount > 0,
          },
          { id: 'workouts', label: `Workout Plans (${workoutPlans.length})`, icon: Dumbbell },
          { id: 'nutrition', label: `Nutrition Plans (${nutritionPlans.length})`, icon: Utensils },
          { id: 'messages', label: 'Messages', icon: MessageSquare },
          { id: 'profile', label: 'Trainer Profile', icon: User },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* ================= TAB 1: OVERVIEW ================= */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fade-up">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Total Clients', value: stats.totalClients, icon: Users, color: 'text-sky-400' },
              { label: 'Active Clients', value: stats.activeClients, icon: UserCheck, color: 'text-emerald-400' },
              { label: 'Pending Requests', value: stats.pendingRequests, icon: Clock, color: 'text-amber-400' },
              { label: 'Workout Plans', value: stats.workoutPlansCount, icon: Dumbbell, color: 'text-primary' },
              { label: 'Nutrition Plans', value: stats.nutritionPlansCount, icon: Utensils, color: 'text-rose-400' },
              { label: 'Profile Rating', value: '5.0 ★', icon: Award, color: 'text-amber-300' },
            ].map((stat, i) => (
              <div key={i} className="glass-strong rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  <span className="text-[10px] text-muted-foreground font-semibold">REAL DATA</span>
                </div>
                <div>
                  <p className="font-display text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Profile Completion Bar */}
          <div className="glass-strong rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-display text-base font-semibold">Coach Profile Completeness</h3>
                <p className="text-xs text-muted-foreground">
                  A complete profile attracts more fitness clients.
                </p>
              </div>
              <span className="font-display font-bold text-lg text-primary">
                {stats.profileCompletion}%
              </span>
            </div>
            <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-primary transition-all duration-500"
                style={{ width: `${stats.profileCompletion}%` }}
              />
            </div>
            {stats.profileCompletion < 100 && (
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>Add certifications, bio, and training types to reach 100%</span>
                <button
                  onClick={() => setActiveTab('profile')}
                  className="text-primary hover:underline font-medium"
                >
                  Edit Profile →
                </button>
              </div>
            )}
          </div>

          {/* Pending Requests & Recent Clients Grids */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Incoming Requests Section */}
            <div className="glass-strong rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-400" /> Pending Training Requests
                </h2>
                {requests.length > 0 && (
                  <button
                    onClick={() => setActiveTab('requests')}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    View all ({requests.length})
                  </button>
                )}
              </div>

              {pendingCount === 0 ? (
                <div className="text-center py-10 glass rounded-xl text-xs text-muted-foreground">
                  <p>No pending training requests.</p>
                  <p className="mt-1 text-[11px]">When users request you as their coach, they will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests
                    .filter((r) => r.status === 'pending')
                    .slice(0, 3)
                    .map((req) => (
                      <div
                        key={req._id}
                        className="glass rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center font-bold text-primary shrink-0">
                            {req.user?.displayName?.[0] || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{req.user?.displayName || 'Fitness User'}</p>
                            <p className="text-xs text-muted-foreground">{req.goal || 'General Fitness'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => handleAcceptRequest(req._id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 text-xs font-medium transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectRequest(req._id)}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 text-xs font-medium transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Active Clients Snapshot */}
            <div className="glass-strong rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> Active Clients
                </h2>
                {clients.length > 0 && (
                  <button
                    onClick={() => setActiveTab('clients')}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    View all ({clients.length})
                  </button>
                )}
              </div>

              {clients.length === 0 ? (
                <div className="text-center py-10 glass rounded-xl text-xs text-muted-foreground">
                  <p>No clients yet.</p>
                  <p className="mt-1 text-[11px]">Once users connect with you, they will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {clients.slice(0, 3).map((item) => (
                    <div
                      key={item._id}
                      className="glass rounded-xl p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center font-bold text-primary shrink-0">
                          {item.client?.displayName?.[0] || 'C'}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{item.client?.displayName || 'Client'}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.primaryGoal || 'Custom Plan'} · Joined {new Date(item.startDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedClient(item.client);
                          setActiveTab('messages');
                        }}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        Message →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: MY CLIENTS ================= */}
      {activeTab === 'clients' && (
        <div className="glass-strong rounded-3xl p-6 sm:p-8 animate-fade-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-2xl font-bold">My Fitness Clients</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage your roster of connected athletes and clients.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1.5 rounded-xl glass text-muted-foreground">
                Total: {clients.length}
              </span>
            </div>
          </div>

          {clients.length === 0 ? (
            <div className="text-center py-16 glass rounded-2xl text-muted-foreground max-w-lg mx-auto">
              <Users className="h-10 w-10 text-primary mx-auto mb-3 opacity-60" />
              <p className="font-display text-lg font-semibold text-foreground">No clients yet.</p>
              <p className="text-xs mt-1">
                Once users discover your profile and you accept their training requests, they will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {clients.map((item) => (
                <div
                  key={item._id}
                  className="glass rounded-2xl p-5 flex flex-col justify-between hover:shadow-glow transition-all"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center font-bold text-lg text-primary shrink-0">
                        {item.client?.displayName?.[0] || 'C'}
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="font-display font-semibold truncate">
                          {item.client?.displayName || 'Client'}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">{item.client?.email}</p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border/40 pt-3 mb-4">
                      <div className="flex justify-between">
                        <span>Goal:</span>
                        <span className="font-medium text-foreground">{item.primaryGoal || 'General Fitness'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className="font-medium text-emerald-400 capitalize">{item.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Since:</span>
                        <span>{new Date(item.startDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                    <button
                      onClick={() => {
                        setEditingWorkout(null);
                        setWorkoutForm({
                          title: `Plan for ${item.client?.displayName || 'Client'}`,
                          description: '',
                          clientId: item.client?._id,
                          goal: item.primaryGoal || 'Hypertrophy',
                          duration: '4 weeks',
                          schedule: '3 days / week',
                          notes: '',
                          exercises: [{ name: '', sets: '3', reps: '10', restTime: '60s', notes: '' }],
                        });
                        setShowWorkoutModal(true);
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 text-xs font-medium transition-colors text-center"
                    >
                      + Workout
                    </button>
                    <button
                      onClick={() => {
                        setSelectedClient(item.client);
                        setActiveTab('messages');
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium transition-colors text-center"
                    >
                      Message
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: REQUESTS ================= */}
      {activeTab === 'requests' && (
        <div className="glass-strong rounded-3xl p-6 sm:p-8 animate-fade-up">
          <div className="mb-6">
            <h2 className="font-display text-2xl font-bold">Training Requests</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review and manage incoming coaching requests from prospective clients.
            </p>
          </div>

          {requests.length === 0 ? (
            <div className="text-center py-16 glass rounded-2xl text-muted-foreground max-w-lg mx-auto">
              <Clock className="h-10 w-10 text-amber-400 mx-auto mb-3 opacity-60" />
              <p className="font-display text-lg font-semibold text-foreground">No pending training requests.</p>
              <p className="text-xs mt-1">
                When users request personal training from your profile, their applications will show up here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div
                  key={req._id}
                  className="glass rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center font-bold text-lg text-primary shrink-0 mt-0.5">
                      {req.user?.displayName?.[0] || 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-base font-semibold">
                          {req.user?.displayName || 'Prospective Client'}
                        </h3>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold capitalize ${
                            req.status === 'accepted'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : req.status === 'rejected'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {req.user?.email} · Level: {req.experienceLevel || 'Beginner'} · Sent {new Date(req.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs font-medium text-foreground mt-2">
                        Goal: <span className="text-muted-foreground font-normal">{req.goal || 'Not specified'}</span>
                      </p>
                      {req.message && (
                        <p className="text-xs text-muted-foreground mt-1 italic bg-input/40 p-2 rounded-lg max-w-xl">
                          "{req.message}"
                        </p>
                      )}
                    </div>
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <button
                        onClick={() => handleAcceptRequest(req._id)}
                        className="px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground text-xs font-semibold shadow-glow hover:opacity-90 transition-opacity"
                      >
                        Accept Request
                      </button>
                      <button
                        onClick={() => handleRejectRequest(req._id)}
                        className="px-3.5 py-2 rounded-xl border border-rose-500/40 text-rose-300 hover:bg-rose-500/10 text-xs font-semibold transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 4: WORKOUT PLANS ================= */}
      {activeTab === 'workouts' && (
        <div className="glass-strong rounded-3xl p-6 sm:p-8 animate-fade-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-2xl font-bold">Client Workout Plans</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Create, structure, and assign custom workout programs.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingWorkout(null);
                setWorkoutForm({
                  title: '',
                  description: '',
                  clientId: clients[0]?.client?._id || '',
                  goal: 'Hypertrophy',
                  duration: '4 weeks',
                  schedule: '3 days / week',
                  notes: '',
                  exercises: [{ name: '', sets: '3', reps: '10', restTime: '60s', notes: '' }],
                });
                setShowWorkoutModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground text-xs font-semibold shadow-glow hover:opacity-90 transition-opacity self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" /> Create Workout Plan
            </button>
          </div>

          {workoutPlans.length === 0 ? (
            <div className="text-center py-16 glass rounded-2xl text-muted-foreground max-w-lg mx-auto">
              <Dumbbell className="h-10 w-10 text-primary mx-auto mb-3 opacity-60" />
              <p className="font-display text-lg font-semibold text-foreground">No workout plans created yet.</p>
              <p className="text-xs mt-1">
                Build personalized workout splits and assign them directly to your clients.
              </p>
              <button
                onClick={() => setShowWorkoutModal(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground text-xs font-semibold hover:opacity-90"
              >
                Create First Workout Plan
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {workoutPlans.map((plan) => (
                <div
                  key={plan._id}
                  className="glass rounded-2xl p-5 flex flex-col justify-between hover:shadow-glow transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                        {plan.goal || 'General Fitness'}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingWorkout(plan);
                            setWorkoutForm({
                              title: plan.title,
                              description: plan.description || '',
                              clientId: plan.client?._id || '',
                              goal: plan.goal || 'Hypertrophy',
                              duration: plan.duration || '4 weeks',
                              schedule: plan.schedule || '3 days / week',
                              notes: plan.notes || '',
                              exercises:
                                plan.exercises && plan.exercises.length > 0
                                  ? plan.exercises
                                  : [{ name: '', sets: '3', reps: '10', restTime: '60s', notes: '' }],
                            });
                            setShowWorkoutModal(true);
                          }}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteWorkout(plan._id)}
                          className="p-1 text-muted-foreground hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-display text-lg font-bold leading-snug">{plan.title}</h3>
                    {plan.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{plan.description}</p>
                    )}

                    <div className="mt-3 py-2 border-y border-border/40 text-xs space-y-1 text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Assigned Client:</span>
                        <span className="font-medium text-foreground">
                          {plan.client?.displayName || 'Unassigned'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Duration / Split:</span>
                        <span>
                          {plan.duration} · {plan.schedule}
                        </span>
                      </div>
                    </div>

                    {/* Exercises Preview */}
                    <div className="mt-3">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase mb-1.5">
                        Exercises ({plan.exercises?.length || 0}):
                      </p>
                      <ul className="space-y-1 max-h-32 overflow-y-auto pr-1">
                        {plan.exercises?.map((ex, i) => (
                          <li
                            key={i}
                            className="text-xs flex justify-between bg-input/40 px-2 py-1 rounded"
                          >
                            <span className="font-medium truncate">{ex.name}</span>
                            <span className="text-muted-foreground shrink-0">
                              {ex.sets} × {ex.reps} ({ex.restTime})
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {plan.notes && (
                    <p className="mt-3 text-[11px] text-muted-foreground italic border-t border-border/40 pt-2">
                      Coach Note: {plan.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 5: NUTRITION PLANS ================= */}
      {activeTab === 'nutrition' && (
        <div className="glass-strong rounded-3xl p-6 sm:p-8 animate-fade-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-2xl font-bold">Client Nutrition Plans</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Design macro targets and meal guides for your clients.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingNutrition(null);
                setNutritionForm({
                  title: '',
                  clientId: clients[0]?.client?._id || '',
                  dailyCalories: 2200,
                  proteinGrams: 160,
                  carbsGrams: 220,
                  fatsGrams: 65,
                  notes: '',
                  meals: [{ mealName: 'Breakfast', items: 'Oatmeal, 3 eggs, blueberries', calories: 550 }],
                });
                setShowNutritionModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground text-xs font-semibold shadow-glow hover:opacity-90 transition-opacity self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" /> Create Nutrition Plan
            </button>
          </div>

          {nutritionPlans.length === 0 ? (
            <div className="text-center py-16 glass rounded-2xl text-muted-foreground max-w-lg mx-auto">
              <Utensils className="h-10 w-10 text-primary mx-auto mb-3 opacity-60" />
              <p className="font-display text-lg font-semibold text-foreground">No nutrition plans yet.</p>
              <p className="text-xs mt-1">
                Define daily calorie & macro goals with meal templates for your connected clients.
              </p>
              <button
                onClick={() => setShowNutritionModal(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground text-xs font-semibold hover:opacity-90"
              >
                Create First Nutrition Plan
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {nutritionPlans.map((plan) => (
                <div
                  key={plan._id}
                  className="glass rounded-2xl p-5 flex flex-col justify-between hover:shadow-glow transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                        {plan.dailyCalories} kcal / day
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingNutrition(plan);
                            setNutritionForm({
                              title: plan.title,
                              clientId: plan.client?._id || '',
                              dailyCalories: plan.dailyCalories || 2000,
                              proteinGrams: plan.proteinGrams || 150,
                              carbsGrams: plan.carbsGrams || 200,
                              fatsGrams: plan.fatsGrams || 65,
                              notes: plan.notes || '',
                              meals:
                                plan.meals && plan.meals.length > 0
                                  ? plan.meals
                                  : [{ mealName: 'Breakfast', items: '', calories: 0 }],
                            });
                            setShowNutritionModal(true);
                          }}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteNutrition(plan._id)}
                          className="p-1 text-muted-foreground hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-display text-lg font-bold leading-snug">{plan.title}</h3>

                    {/* Macros Grid */}
                    <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                      <div className="bg-input/40 rounded-xl p-2">
                        <p className="text-[10px] text-muted-foreground">Protein</p>
                        <p className="font-bold text-sm text-foreground">{plan.proteinGrams}g</p>
                      </div>
                      <div className="bg-input/40 rounded-xl p-2">
                        <p className="text-[10px] text-muted-foreground">Carbs</p>
                        <p className="font-bold text-sm text-foreground">{plan.carbsGrams}g</p>
                      </div>
                      <div className="bg-input/40 rounded-xl p-2">
                        <p className="text-[10px] text-muted-foreground">Fats</p>
                        <p className="font-bold text-sm text-foreground">{plan.fatsGrams}g</p>
                      </div>
                    </div>

                    <div className="mt-3 py-2 border-t border-border/40 text-xs flex justify-between text-muted-foreground">
                      <span>Assigned Client:</span>
                      <span className="font-medium text-foreground">
                        {plan.client?.displayName || 'Unassigned'}
                      </span>
                    </div>

                    {/* Meals Breakdown */}
                    <div className="mt-2">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                        Meals Breakdown:
                      </p>
                      <ul className="space-y-1 max-h-28 overflow-y-auto pr-1">
                        {plan.meals?.map((m, i) => (
                          <li
                            key={i}
                            className="text-xs bg-input/40 p-2 rounded flex items-start justify-between"
                          >
                            <div>
                              <span className="font-semibold text-primary">{m.mealName}: </span>
                              <span className="text-muted-foreground">{m.items}</span>
                            </div>
                            {m.calories > 0 && (
                              <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                                {m.calories} kcal
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {plan.notes && (
                    <p className="mt-3 text-[11px] text-muted-foreground italic border-t border-border/40 pt-2">
                      Coach Note: {plan.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 6: MESSAGES ================= */}
      {activeTab === 'messages' && (
        <div className="glass-strong rounded-3xl p-6 shadow-elegant animate-fade-up">
          <div className="grid md:grid-cols-3 gap-6 h-[600px]">
            {/* Clients List Sidebar */}
            <div className="border-r border-border/40 pr-4 flex flex-col h-full">
              <h3 className="font-display font-semibold text-base mb-3">Client Conversations</h3>
              {clients.length === 0 ? (
                <div className="text-center py-10 text-xs text-muted-foreground">
                  No connected clients yet to chat with.
                </div>
              ) : (
                <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                  {clients.map((item) => {
                    const isSelected = selectedClient?._id === item.client?._id;
                    return (
                      <button
                        key={item._id}
                        onClick={() => setSelectedClient(item.client)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                          isSelected ? 'bg-primary/20 border border-primary/40' : 'glass hover:bg-secondary/60'
                        }`}
                      >
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center font-bold text-primary shrink-0">
                          {item.client?.displayName?.[0] || 'C'}
                        </div>
                        <div className="overflow-hidden flex-1">
                          <p className="text-sm font-semibold truncate">{item.client?.displayName}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.primaryGoal}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Active Message Thread */}
            <div className="md:col-span-2 flex flex-col h-full">
              {selectedClient ? (
                <>
                  {/* Chat Header */}
                  <div className="pb-3 border-b border-border/40 flex items-center justify-between">
                    <div>
                      <h4 className="font-display font-semibold text-base">
                        Chatting with {selectedClient.displayName}
                      </h4>
                      <p className="text-xs text-muted-foreground">{selectedClient.email}</p>
                    </div>
                  </div>

                  {/* Messages Window */}
                  <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-2">
                    {loadingMessages ? (
                      <p className="text-center text-xs text-muted-foreground py-10">Loading messages...</p>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-xs text-muted-foreground py-16">
                        No messages yet with {selectedClient.displayName}. Send your first message below!
                      </div>
                    ) : (
                      messages.map((m) => {
                        const isMe = m.sender?._id === user._id || m.sender?.role === 'trainer';
                        return (
                          <div
                            key={m._id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm ${
                                isMe
                                  ? 'bg-gradient-primary text-primary-foreground rounded-br-sm'
                                  : 'glass bg-secondary/80 text-foreground rounded-bl-sm'
                              }`}
                            >
                              <p>{m.content}</p>
                              <span className="text-[9px] opacity-70 block text-right mt-1">
                                {new Date(m.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Input form */}
                  <form onSubmit={handleSendMessage} className="pt-3 border-t border-border/40 flex gap-2">
                    <input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder={`Message ${selectedClient.displayName}...`}
                      className="flex-1 bg-input/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring border border-border/40"
                    />
                    <button
                      type="submit"
                      disabled={!messageInput.trim()}
                      className="bg-gradient-primary text-primary-foreground px-4 py-2.5 rounded-xl font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
                  Select a client to view and send messages.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 7: PROFILE ================= */}
      {activeTab === 'profile' && (
        <div className="glass-strong rounded-3xl p-6 sm:p-8 animate-fade-up max-w-4xl mx-auto">
          <div className="mb-6">
            <h2 className="font-display text-2xl font-bold">Trainer Professional Profile</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Update your qualifications, specialties, and contact details visible to users.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Display / Full Name
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.displayName}
                  onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                  className="w-full bg-input/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring border border-border/40"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full bg-input/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring border border-border/40"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Specialization
                </label>
                <input
                  type="text"
                  value={profileForm.specialization}
                  onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })}
                  className="w-full bg-input/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring border border-border/40"
                  placeholder="e.g. Strength & Conditioning"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Years of Experience
                </label>
                <input
                  type="text"
                  value={profileForm.experience}
                  onChange={(e) => setProfileForm({ ...profileForm, experience: e.target.value })}
                  className="w-full bg-input/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring border border-border/40"
                  placeholder="e.g. 6+ Years"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Certifications
                </label>
                <input
                  type="text"
                  value={profileForm.certifications}
                  onChange={(e) => setProfileForm({ ...profileForm, certifications: e.target.value })}
                  className="w-full bg-input/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring border border-border/40"
                  placeholder="e.g. NASM-CPT, CSCS"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Hourly Rate ($)
                </label>
                <input
                  type="number"
                  min={0}
                  value={profileForm.hourlyRate}
                  onChange={(e) => setProfileForm({ ...profileForm, hourlyRate: e.target.value })}
                  className="w-full bg-input/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring border border-border/40"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={profileForm.location}
                  onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                  className="w-full bg-input/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring border border-border/40"
                  placeholder="e.g. Austin, TX / Remote"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Availability
                </label>
                <input
                  type="text"
                  value={profileForm.availability}
                  onChange={(e) => setProfileForm({ ...profileForm, availability: e.target.value })}
                  className="w-full bg-input/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring border border-border/40"
                  placeholder="e.g. Accepting 3 new clients"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Profile Picture URL
                </label>
                <input
                  type="url"
                  value={profileForm.profileImage}
                  onChange={(e) => setProfileForm({ ...profileForm, profileImage: e.target.value })}
                  className="w-full bg-input/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring border border-border/40"
                  placeholder="https://images.unsplash.com/photo-..."
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Bio / Coaching Philosophy
                </label>
                <textarea
                  rows={3}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  className="w-full bg-input/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring border border-border/40 resize-none"
                  placeholder="Write a brief overview of your coaching methodology..."
                />
              </div>
            </div>

            <button
              type="submit"
              className="bg-gradient-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-semibold shadow-glow hover:opacity-90 transition-opacity"
            >
              Save Profile Changes
            </button>
          </form>
        </div>
      )}

      {/* ================= MODAL: WORKOUT PLAN ================= */}
      {showWorkoutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto"
          onClick={() => setShowWorkoutModal(false)}
        >
          <div
            className="glass-strong rounded-2xl max-w-2xl w-full p-6 my-8 shadow-elegant max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-border/40 mb-4">
              <h3 className="font-display text-xl font-bold">
                {editingWorkout ? 'Edit Workout Plan' : 'Create New Workout Plan'}
              </h3>
              <button
                onClick={() => setShowWorkoutModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWorkoutPlan} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Plan Title *
                </label>
                <input
                  type="text"
                  required
                  value={workoutForm.title}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, title: e.target.value })}
                  placeholder="e.g. 4-Week Strength Foundation"
                  className="w-full bg-input/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring border border-border/40"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Assign To Client
                  </label>
                  <select
                    value={workoutForm.clientId}
                    onChange={(e) => setWorkoutForm({ ...workoutForm, clientId: e.target.value })}
                    className="w-full bg-input/60 rounded-xl px-3 py-2.5 text-sm outline-none border border-border/40 text-foreground"
                  >
                    <option value="">-- General / Unassigned --</option>
                    {clients.map((c) => (
                      <option key={c.client?._id} value={c.client?._id}>
                        {c.client?.displayName} ({c.client?.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Goal</label>
                  <input
                    type="text"
                    value={workoutForm.goal}
                    onChange={(e) => setWorkoutForm({ ...workoutForm, goal: e.target.value })}
                    placeholder="e.g. Muscle Gain"
                    className="w-full bg-input/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-border/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={workoutForm.duration}
                    onChange={(e) => setWorkoutForm({ ...workoutForm, duration: e.target.value })}
                    placeholder="e.g. 6 weeks"
                    className="w-full bg-input/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-border/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Weekly Schedule
                  </label>
                  <input
                    type="text"
                    value={workoutForm.schedule}
                    onChange={(e) => setWorkoutForm({ ...workoutForm, schedule: e.target.value })}
                    placeholder="e.g. Mon / Wed / Fri"
                    className="w-full bg-input/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-border/40"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={workoutForm.description}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, description: e.target.value })}
                  placeholder="Overview of this routine split..."
                  className="w-full bg-input/60 rounded-xl px-4 py-2 text-xs outline-none border border-border/40 resize-none"
                />
              </div>

              {/* Dynamic Exercises List */}
              <div className="border-t border-border/40 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Exercises
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setWorkoutForm({
                        ...workoutForm,
                        exercises: [
                          ...workoutForm.exercises,
                          { name: '', sets: '3', reps: '10', restTime: '60s', notes: '' },
                        ],
                      })
                    }
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <Plus className="h-3 w-3" /> Add Exercise
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {workoutForm.exercises.map((ex, i) => (
                    <div key={i} className="flex items-center gap-2 bg-input/40 p-2 rounded-xl">
                      <input
                        placeholder="Exercise name"
                        value={ex.name}
                        onChange={(e) => {
                          const next = [...workoutForm.exercises];
                          next[i].name = e.target.value;
                          setWorkoutForm({ ...workoutForm, exercises: next });
                        }}
                        className="flex-1 bg-transparent text-xs outline-none border-b border-border/40 pb-1"
                      />
                      <input
                        placeholder="Sets"
                        value={ex.sets}
                        onChange={(e) => {
                          const next = [...workoutForm.exercises];
                          next[i].sets = e.target.value;
                          setWorkoutForm({ ...workoutForm, exercises: next });
                        }}
                        className="w-14 bg-transparent text-xs outline-none border-b border-border/40 pb-1 text-center"
                      />
                      <input
                        placeholder="Reps"
                        value={ex.reps}
                        onChange={(e) => {
                          const next = [...workoutForm.exercises];
                          next[i].reps = e.target.value;
                          setWorkoutForm({ ...workoutForm, exercises: next });
                        }}
                        className="w-16 bg-transparent text-xs outline-none border-b border-border/40 pb-1 text-center"
                      />
                      <input
                        placeholder="Rest"
                        value={ex.restTime}
                        onChange={(e) => {
                          const next = [...workoutForm.exercises];
                          next[i].restTime = e.target.value;
                          setWorkoutForm({ ...workoutForm, exercises: next });
                        }}
                        className="w-14 bg-transparent text-xs outline-none border-b border-border/40 pb-1 text-center"
                      />
                      {workoutForm.exercises.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setWorkoutForm({
                              ...workoutForm,
                              exercises: workoutForm.exercises.filter((_, idx) => idx !== i),
                            });
                          }}
                          className="text-muted-foreground hover:text-rose-400 p-1"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Coach Guidance Notes
                </label>
                <input
                  type="text"
                  value={workoutForm.notes}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, notes: e.target.value })}
                  placeholder="e.g. Focus on progressive overload each week."
                  className="w-full bg-input/60 rounded-xl px-4 py-2 text-xs outline-none border border-border/40"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWorkoutModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity shadow-glow"
                >
                  {editingWorkout ? 'Save Changes' : 'Publish Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: NUTRITION PLAN ================= */}
      {showNutritionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto"
          onClick={() => setShowNutritionModal(false)}
        >
          <div
            className="glass-strong rounded-2xl max-w-2xl w-full p-6 my-8 shadow-elegant max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-border/40 mb-4">
              <h3 className="font-display text-xl font-bold">
                {editingNutrition ? 'Edit Nutrition Plan' : 'Create New Nutrition Plan'}
              </h3>
              <button
                onClick={() => setShowNutritionModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNutritionPlan} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Plan Title *
                </label>
                <input
                  type="text"
                  required
                  value={nutritionForm.title}
                  onChange={(e) => setNutritionForm({ ...nutritionForm, title: e.target.value })}
                  placeholder="e.g. Lean Bulk Caloric Surplus"
                  className="w-full bg-input/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-border/40"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Assign To Client
                </label>
                <select
                  value={nutritionForm.clientId}
                  onChange={(e) => setNutritionForm({ ...nutritionForm, clientId: e.target.value })}
                  className="w-full bg-input/60 rounded-xl px-3 py-2.5 text-sm outline-none border border-border/40 text-foreground"
                >
                  <option value="">-- General / Unassigned --</option>
                  {clients.map((c) => (
                    <option key={c.client?._id} value={c.client?._id}>
                      {c.client?.displayName} ({c.client?.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                    Daily Calories (kcal)
                  </label>
                  <input
                    type="number"
                    value={nutritionForm.dailyCalories}
                    onChange={(e) =>
                      setNutritionForm({ ...nutritionForm, dailyCalories: e.target.value })
                    }
                    className="w-full bg-input/60 rounded-xl px-3 py-2 text-xs outline-none border border-border/40"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    value={nutritionForm.proteinGrams}
                    onChange={(e) =>
                      setNutritionForm({ ...nutritionForm, proteinGrams: e.target.value })
                    }
                    className="w-full bg-input/60 rounded-xl px-3 py-2 text-xs outline-none border border-border/40"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    value={nutritionForm.carbsGrams}
                    onChange={(e) =>
                      setNutritionForm({ ...nutritionForm, carbsGrams: e.target.value })
                    }
                    className="w-full bg-input/60 rounded-xl px-3 py-2 text-xs outline-none border border-border/40"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                    Fats (g)
                  </label>
                  <input
                    type="number"
                    value={nutritionForm.fatsGrams}
                    onChange={(e) =>
                      setNutritionForm({ ...nutritionForm, fatsGrams: e.target.value })
                    }
                    className="w-full bg-input/60 rounded-xl px-3 py-2 text-xs outline-none border border-border/40"
                  />
                </div>
              </div>

              {/* Dynamic Meals */}
              <div className="border-t border-border/40 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Meals Breakdown
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setNutritionForm({
                        ...nutritionForm,
                        meals: [
                          ...nutritionForm.meals,
                          { mealName: 'Lunch', items: '', calories: 0 },
                        ],
                      })
                    }
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <Plus className="h-3 w-3" /> Add Meal
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {nutritionForm.meals.map((meal, i) => (
                    <div key={i} className="flex items-center gap-2 bg-input/40 p-2 rounded-xl">
                      <input
                        placeholder="e.g. Breakfast"
                        value={meal.mealName}
                        onChange={(e) => {
                          const next = [...nutritionForm.meals];
                          next[i].mealName = e.target.value;
                          setNutritionForm({ ...nutritionForm, meals: next });
                        }}
                        className="w-24 bg-transparent text-xs outline-none border-b border-border/40 pb-1"
                      />
                      <input
                        placeholder="Food items description"
                        value={meal.items}
                        onChange={(e) => {
                          const next = [...nutritionForm.meals];
                          next[i].items = e.target.value;
                          setNutritionForm({ ...nutritionForm, meals: next });
                        }}
                        className="flex-1 bg-transparent text-xs outline-none border-b border-border/40 pb-1"
                      />
                      <input
                        placeholder="kcal"
                        type="number"
                        value={meal.calories || ''}
                        onChange={(e) => {
                          const next = [...nutritionForm.meals];
                          next[i].calories = Number(e.target.value);
                          setNutritionForm({ ...nutritionForm, meals: next });
                        }}
                        className="w-16 bg-transparent text-xs outline-none border-b border-border/40 pb-1 text-center"
                      />
                      {nutritionForm.meals.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setNutritionForm({
                              ...nutritionForm,
                              meals: nutritionForm.meals.filter((_, idx) => idx !== i),
                            });
                          }}
                          className="text-muted-foreground hover:text-rose-400 p-1"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Notes & Hydration Instructions
                </label>
                <input
                  type="text"
                  value={nutritionForm.notes}
                  onChange={(e) => setNutritionForm({ ...nutritionForm, notes: e.target.value })}
                  placeholder="e.g. Minimum 3.5 Liters of water daily. Post-workout carbs within 1 hour."
                  className="w-full bg-input/60 rounded-xl px-4 py-2 text-xs outline-none border border-border/40"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNutritionModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity shadow-glow"
                >
                  {editingNutrition ? 'Save Changes' : 'Publish Nutrition Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
