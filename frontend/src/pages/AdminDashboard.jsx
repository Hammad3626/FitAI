import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Award,
  MessageSquare,
  ShieldAlert,
  LogOut,
  LayoutDashboard,
  Search,
  Trash2,
  CheckCircle,
  Clock,
  Dumbbell,
  Utensils,
  RefreshCw,
  Menu,
  X,
  UserCheck,
  ChevronRight,
  Activity,
  AlertCircle,
  CreditCard,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { toast } from '../components/Toast';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, loading, logout, isAdmin } = useAuth();

  // Navigation tab state: 'overview' | 'users' | 'trainers' | 'messages'
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data states (Real MongoDB data only)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTrainers: 0,
    activeClients: 0,
    pendingRequests: 0,
    totalMessages: 0,
    totalWorkoutPlans: 0,
    totalNutritionPlans: 0,
  });

  const [usersList, setUsersList] = useState([]);
  const [trainersList, setTrainersList] = useState([]);
  const [messagesList, setMessagesList] = useState([]);
  const [subscriptionsList, setSubscriptionsList] = useState([]);
  const [paymentsList, setPaymentsList] = useState([]);
  const [revenueStats, setRevenueStats] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search filters
  const [userSearch, setUserSearch] = useState('');
  const [trainerSearch, setTrainerSearch] = useState('');
  const [messageSearch, setMessageSearch] = useState('');

  // Delete modal confirmation state
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'user'|'trainer', item: obj }
  const [isDeleting, setIsDeleting] = useState(false);

  // ─── Route Guard: strictly allow only role === 'admin' ────────────────────
  useEffect(() => {
    if (!loading) {
      if (!user) {
        toast.error('Please sign in to access this area');
        navigate('/auth');
      } else if (user.role !== 'admin') {
        toast.error('Access denied: Administrator privileges required');
        if (user.role === 'trainer') {
          navigate('/trainer/dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    }
  }, [user, loading, navigate]);

  // ─── Fetch All Admin Data ─────────────────────────────────────────────────
  const fetchAllData = async () => {
    try {
      setRefreshing(true);
      const [statsRes, usersRes, trainersRes, messagesRes, subsRes, paymentsRes, revenueRes] = await Promise.all([
        api.get('/admin/stats').catch(() => null),
        api.get('/admin/users').catch(() => []),
        api.get('/admin/trainers').catch(() => []),
        api.get('/admin/messages').catch(() => []),
        api.get('/admin/subscriptions').catch(() => []),
        api.get('/admin/payments').catch(() => []),
        api.get('/admin/revenue').catch(() => null),
      ]);

      if (statsRes) setStats(statsRes);
      if (Array.isArray(usersRes)) setUsersList(usersRes);
      if (Array.isArray(trainersRes)) setTrainersList(trainersRes);
      if (Array.isArray(messagesRes)) setMessagesList(messagesRes);
      if (Array.isArray(subsRes)) setSubscriptionsList(subsRes);
      if (Array.isArray(paymentsRes)) setPaymentsList(paymentsRes);
      if (revenueRes) setRevenueStats(revenueRes);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      toast.error('Failed to load real-time admin metrics');
    } finally {
      setLoadingData(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchAllData();
    }
  }, [user]);

  // ─── Handle Delete User / Trainer ─────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      if (deleteTarget.type === 'user') {
        await api.delete(`/admin/users/${deleteTarget.item._id}`);
        setUsersList((prev) => prev.filter((u) => u._id !== deleteTarget.item._id));
        setStats((prev) => ({
          ...prev,
          totalUsers: Math.max(0, prev.totalUsers - 1),
        }));
        toast.success(`User "${deleteTarget.item.displayName}" deleted successfully`);
      } else if (deleteTarget.type === 'trainer') {
        await api.delete(`/admin/trainers/${deleteTarget.item._id}`);
        setTrainersList((prev) => prev.filter((t) => t._id !== deleteTarget.item._id));
        setStats((prev) => ({
          ...prev,
          totalTrainers: Math.max(0, prev.totalTrainers - 1),
        }));
        toast.success(`Trainer "${deleteTarget.item.displayName}" deleted successfully`);
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete item:', err);
      toast.error(err.message || 'Action failed. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── Handle Logout ────────────────────────────────────────────────────────
  const handleLogout = () => {
    logout();
    toast.success('Admin logged out successfully');
    navigate('/auth');
  };

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">Verifying administrator credentials...</p>
        </div>
      </div>
    );
  }

  // ─── Filtered Lists ───────────────────────────────────────────────────────
  const filteredUsers = usersList.filter(
    (u) =>
      u.displayName?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredTrainers = trainersList.filter(
    (t) =>
      t.displayName?.toLowerCase().includes(trainerSearch.toLowerCase()) ||
      t.email?.toLowerCase().includes(trainerSearch.toLowerCase()) ||
      t.specialization?.toLowerCase().includes(trainerSearch.toLowerCase())
  );

  const filteredMessages = messagesList.filter(
    (m) =>
      m.content?.toLowerCase().includes(messageSearch.toLowerCase()) ||
      m.sender?.displayName?.toLowerCase().includes(messageSearch.toLowerCase()) ||
      m.receiver?.displayName?.toLowerCase().includes(messageSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* ─── Mobile Header ───────────────────────────────────────────────── */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border/40 glass">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center font-bold text-white shadow-glow">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <h1 className="font-display text-sm font-bold">Admin Portal</h1>
            <p className="text-[10px] text-muted-foreground">{user.displayName || 'SuperAdmin'}</p>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-secondary/60 text-muted-foreground hover:text-foreground"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* ─── Sidebar Navigation ─────────────────────────────────────────── */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 glass-strong border-r border-border/40 p-5 flex flex-col justify-between shrink-0 z-20`}
      >
        <div>
          {/* Admin Header */}
          <div className="hidden md:flex items-center gap-3 pb-6 border-b border-border/40 mb-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center font-bold text-white shadow-glow">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold flex items-center gap-1.5">
                Admin Panel
                <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.2 rounded font-bold uppercase">
                  Root
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">{user.displayName || 'SuperAdmin'}</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {[
              { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, count: null },
              { id: 'users', label: 'Users & Clients', icon: Users, count: stats.totalUsers },
              { id: 'trainers', label: 'Trainers / Coaches', icon: Award, count: stats.totalTrainers },
              { id: 'messages', label: 'Messages Monitor', icon: MessageSquare, count: stats.totalMessages },
              { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard, count: subscriptionsList.length || null },
              { id: 'revenue', label: 'Payments & Revenue', icon: TrendingUp, count: null },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-primary text-primary-foreground shadow-glow font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </div>
                  {tab.count !== null && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-primary-foreground/20 text-primary-foreground font-bold'
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Refresh & Logout */}
        <div className="pt-6 border-t border-border/40 space-y-2 mt-6">
          <button
            onClick={fetchAllData}
            disabled={refreshing}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground bg-secondary/40 hover:bg-secondary/70 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Live Data'}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out (Admin)
          </button>
        </div>
      </aside>

      {/* ─── Main Content Area ──────────────────────────────────────────── */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {/* Top bar title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-primary font-semibold uppercase tracking-wider">
              <ShieldAlert className="h-3.5 w-3.5" /> FitAI Administrative Control
            </div>
            <h1 className="font-display text-3xl font-bold mt-1">
              {activeTab === 'overview' && 'System Overview'}
              {activeTab === 'users' && 'Users & Clients Directory'}
              {activeTab === 'trainers' && 'Certified Trainers Roster'}
              {activeTab === 'messages' && 'Platform Communications'}
              {activeTab === 'subscriptions' && 'Subscriptions Overview'}
              {activeTab === 'revenue' && 'Payments & Revenue'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {activeTab === 'overview' && 'Real-time metrics and system health from MongoDB'}
              {activeTab === 'users' && `Manage registered clients and coaching assignments (${usersList.length} total)`}
              {activeTab === 'trainers' && `Monitor certified fitness coaches and client rosters (${trainersList.length} total)`}
              {activeTab === 'messages' && `Live record of messages between coaches and clients (${messagesList.length} total)`}
              {activeTab === 'subscriptions' && `All user subscription plans (${subscriptionsList.length} total)`}
              {activeTab === 'revenue' && 'Payment transactions and revenue breakdown'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAllData}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-border/60 hover:bg-secondary text-xs font-semibold transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Sync DB
            </button>
          </div>
        </div>

        {/* ─── TAB 1: OVERVIEW ────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-up">
            {/* Primary Stat Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  label: 'Total Registered Clients',
                  value: stats.totalUsers,
                  sub: 'Active client accounts',
                  icon: Users,
                  color: 'text-primary',
                },
                {
                  label: 'Certified Trainers',
                  value: stats.totalTrainers,
                  sub: 'Fitness coaches on platform',
                  icon: Award,
                  color: 'text-emerald-400',
                },
                {
                  label: 'Active Coaching Ties',
                  value: stats.activeClients,
                  sub: '1-on-1 coach relationships',
                  icon: UserCheck,
                  color: 'text-cyan-400',
                },
                {
                  label: 'Platform Messages',
                  value: stats.totalMessages,
                  sub: 'Coach ↔ Client chats',
                  icon: MessageSquare,
                  color: 'text-violet-400',
                },
              ].map((card, i) => (
                <div key={i} className="glass-strong rounded-2xl p-5 border border-border/40 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <p className="font-display text-3xl font-extrabold">{card.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="glass rounded-xl p-5 border border-border/40 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pending Requests</p>
                  <p className="font-display text-2xl font-bold mt-1">{stats.pendingRequests}</p>
                  <p className="text-[10px] text-amber-400 mt-0.5">Awaiting coach acceptance</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <Clock className="h-5 w-5" />
                </div>
              </div>

              <div className="glass rounded-xl p-5 border border-border/40 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Assigned Workout Plans</p>
                  <p className="font-display text-2xl font-bold mt-1">{stats.totalWorkoutPlans}</p>
                  <p className="text-[10px] text-primary mt-0.5">Custom routines designed</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Dumbbell className="h-5 w-5" />
                </div>
              </div>

              <div className="glass rounded-xl p-5 border border-border/40 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Assigned Nutrition Plans</p>
                  <p className="font-display text-2xl font-bold mt-1">{stats.totalNutritionPlans}</p>
                  <p className="text-[10px] text-emerald-400 mt-0.5">Custom diets formulated</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Utensils className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Recent Platform Activity & Quick Jump */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Users preview */}
              <div className="glass-strong rounded-2xl p-6 border border-border/40">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <h3 className="font-display text-base font-bold">Recently Registered Clients</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('users')}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    View All <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                {usersList.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-8 text-center">No users registered yet.</p>
                ) : (
                  <div className="divide-y divide-border/30">
                    {usersList.slice(0, 5).map((u) => (
                      <div key={u._id} className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold text-white shadow-glow">
                            {u.displayName?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{u.displayName}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {u.assignedTrainer ? (
                            <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-medium">
                              Coach: {u.assignedTrainer.displayName}
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                              No Coach
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Trainers preview */}
              <div className="glass-strong rounded-2xl p-6 border border-border/40">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-emerald-400" />
                    <h3 className="font-display text-base font-bold">Certified Trainers</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('trainers')}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    View All <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                {trainersList.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-8 text-center">No trainers registered yet.</p>
                ) : (
                  <div className="divide-y divide-border/30">
                    {trainersList.slice(0, 5).map((t) => (
                      <div key={t._id} className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {t.profileImage ? (
                            <img
                              src={t.profileImage}
                              alt={t.displayName}
                              className="h-8 w-8 rounded-full object-cover border border-emerald-500/30"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs font-bold">
                              {t.displayName?.[0]?.toUpperCase() || 'T'}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold">{t.displayName}</p>
                            <p className="text-xs text-emerald-400/90">{t.specialization}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold">{t.activeClientsCount}</span>
                          <span className="text-[10px] text-muted-foreground block">clients</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: USERS DIRECTORY ─────────────────────────────────────── */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-fade-up">
            {/* Search and control bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 glass rounded-xl p-4 border border-border/40">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search clients by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-input/60 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring border border-border/40 text-foreground"
                />
              </div>
              <div className="text-xs text-muted-foreground self-center">
                Showing {filteredUsers.length} of {usersList.length} clients
              </div>
            </div>

            {/* Users Table */}
            <div className="glass-strong rounded-2xl border border-border/40 overflow-hidden shadow-elegant">
              {filteredUsers.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-base font-semibold">No clients found</p>
                  <p className="text-xs mt-1">
                    {userSearch ? 'Try a different search term.' : 'No users have registered as clients yet.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-secondary/50 text-xs text-muted-foreground uppercase border-b border-border/40">
                      <tr>
                        <th className="px-6 py-3.5">Client</th>
                        <th className="px-6 py-3.5">Email</th>
                        <th className="px-6 py-3.5">Assigned Coach</th>
                        <th className="px-6 py-3.5">Registered</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {filteredUsers.map((u) => (
                        <tr key={u._id} className="hover:bg-secondary/30 transition-colors">
                          <td className="px-6 py-4 font-medium flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-gradient-primary flex items-center justify-center font-bold text-xs text-white shadow-glow shrink-0">
                              {u.displayName?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{u.displayName}</p>
                              <span className="text-[10px] text-muted-foreground">ID: {u._id.slice(-6)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                          <td className="px-6 py-4">
                            {u.assignedTrainer ? (
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                                <div>
                                  <p className="font-semibold text-xs text-foreground">
                                    {u.assignedTrainer.displayName}
                                  </p>
                                  <p className="text-[10px] text-primary">{u.assignedTrainer.specialization}</p>
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">No Trainer Assigned</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs text-muted-foreground">
                            {new Date(u.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setDeleteTarget({ type: 'user', item: u })}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors inline-flex items-center gap-1"
                              title="Delete client account"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 3: TRAINERS ROSTER ─────────────────────────────────────── */}
        {activeTab === 'trainers' && (
          <div className="space-y-6 animate-fade-up">
            {/* Search and control bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 glass rounded-xl p-4 border border-border/40">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search trainers by name, email, or specialty..."
                  value={trainerSearch}
                  onChange={(e) => setTrainerSearch(e.target.value)}
                  className="w-full bg-input/60 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring border border-border/40 text-foreground"
                />
              </div>
              <div className="text-xs text-muted-foreground self-center">
                Showing {filteredTrainers.length} of {trainersList.length} coaches
              </div>
            </div>

            {/* Trainers Table */}
            <div className="glass-strong rounded-2xl border border-border/40 overflow-hidden shadow-elegant">
              {filteredTrainers.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <Award className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-base font-semibold">No trainers found</p>
                  <p className="text-xs mt-1">
                    {trainerSearch ? 'Try a different search term.' : 'No trainers have registered on the platform yet.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-secondary/50 text-xs text-muted-foreground uppercase border-b border-border/40">
                      <tr>
                        <th className="px-6 py-3.5">Trainer</th>
                        <th className="px-6 py-3.5">Specialization</th>
                        <th className="px-6 py-3.5">Experience & Location</th>
                        <th className="px-6 py-3.5">Active Clients</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {filteredTrainers.map((t) => (
                        <tr key={t._id} className="hover:bg-secondary/30 transition-colors">
                          <td className="px-6 py-4 font-medium flex items-center gap-3">
                            {t.profileImage ? (
                              <img
                                src={t.profileImage}
                                alt={t.displayName}
                                className="h-9 w-9 rounded-full object-cover border border-primary/30 shrink-0"
                              />
                            ) : (
                              <div className="h-9 w-9 rounded-full bg-gradient-primary flex items-center justify-center font-bold text-xs text-white shadow-glow shrink-0">
                                {t.displayName?.[0]?.toUpperCase() || 'T'}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-foreground">{t.displayName}</p>
                              <p className="text-xs text-muted-foreground">{t.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-semibold text-primary">{t.specialization}</span>
                            {t.hourlyRate > 0 && (
                              <span className="text-[10px] text-muted-foreground block">
                                ${t.hourlyRate}/session
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs text-muted-foreground">
                            <p>{t.experience}</p>
                            <p className="text-[10px] text-muted-foreground/80">{t.location}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                              <Users className="h-3 w-3" />
                              {t.activeClientsCount} clients
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
                              {t.availability || 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setDeleteTarget({ type: 'trainer', item: t })}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors inline-flex items-center gap-1"
                              title="Delete trainer account"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 4: MESSAGES MONITOR ────────────────────────────────────── */}
        {activeTab === 'messages' && (
          <div className="space-y-6 animate-fade-up">
            {/* Search and control bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 glass rounded-xl p-4 border border-border/40">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search message text, sender, or recipient..."
                  value={messageSearch}
                  onChange={(e) => setMessageSearch(e.target.value)}
                  className="w-full bg-input/60 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring border border-border/40 text-foreground"
                />
              </div>
              <div className="text-xs text-muted-foreground self-center">
                Showing {filteredMessages.length} of {messagesList.length} total messages
              </div>
            </div>

            {/* Messages Feed */}
            <div className="glass-strong rounded-2xl border border-border/40 overflow-hidden shadow-elegant">
              {filteredMessages.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-base font-semibold">No messages found</p>
                  <p className="text-xs mt-1">
                    {messageSearch ? 'Try a different search query.' : 'No messages have been exchanged between clients and coaches yet.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {filteredMessages.map((m) => (
                    <div key={m._id} className="p-4 hover:bg-secondary/20 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-foreground">
                            {m.sender?.displayName || 'Unknown Sender'}
                          </span>
                          <span className="text-[10px] bg-secondary px-1.5 py-0.2 rounded text-muted-foreground uppercase font-bold">
                            {m.sender?.role || 'user'}
                          </span>
                          <span className="text-muted-foreground text-xs">→</span>
                          <span className="font-semibold text-xs text-foreground">
                            {m.receiver?.displayName || 'Unknown Receiver'}
                          </span>
                          <span className="text-[10px] bg-secondary px-1.5 py-0.2 rounded text-muted-foreground uppercase font-bold">
                            {m.receiver?.role || 'user'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(m.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}{' '}
                            {new Date(m.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {m.read ? (
                            <span className="text-[10px] text-emerald-400 font-medium">Read</span>
                          ) : (
                            <span className="text-[10px] text-amber-400 font-medium">Unread</span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-foreground/90 bg-input/30 p-3 rounded-xl border border-border/20 whitespace-pre-wrap">
                        {m.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 5: SUBSCRIPTIONS ───────────────────────────────────────── */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-6 animate-fade-up">
            {/* Plan breakdown cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                {
                  label: 'Free Plan',
                  count: subscriptionsList.filter((s) => s.planId === 'free').length,
                  color: 'text-muted-foreground',
                  bg: 'bg-secondary/40',
                  border: 'border-border/40',
                },
                {
                  label: 'Basic Plan',
                  count: subscriptionsList.filter((s) => s.planId === 'basic').length,
                  color: 'text-cyan-400',
                  bg: 'bg-cyan-500/10',
                  border: 'border-cyan-500/20',
                },
                {
                  label: 'Pro Plan',
                  count: subscriptionsList.filter((s) => s.planId === 'pro').length,
                  color: 'text-primary',
                  bg: 'bg-primary/10',
                  border: 'border-primary/20',
                },
              ].map((card) => (
                <div key={card.label} className={`glass-strong rounded-2xl p-5 border ${card.border}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
                    <CreditCard className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <p className={`font-display text-3xl font-extrabold ${card.color}`}>{card.count}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">subscribers</p>
                </div>
              ))}
            </div>

            {/* Subscriptions table */}
            <div className="glass-strong rounded-2xl border border-border/40 overflow-hidden shadow-elegant">
              {subscriptionsList.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-base font-semibold">No subscriptions yet</p>
                  <p className="text-xs mt-1">Users will appear here once they visit the platform.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-secondary/50 text-xs text-muted-foreground uppercase border-b border-border/40">
                      <tr>
                        <th className="px-6 py-3.5">User</th>
                        <th className="px-6 py-3.5">Plan</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5">AI Queries Today</th>
                        <th className="px-6 py-3.5">Start Date</th>
                        <th className="px-6 py-3.5">End Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {subscriptionsList.map((s) => (
                        <tr key={s._id} className="hover:bg-secondary/30 transition-colors">
                          <td className="px-6 py-4 font-medium">
                            <p className="font-semibold text-foreground">{s.user?.displayName || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{s.user?.email}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                              s.planId === 'pro'
                                ? 'bg-primary/10 text-primary border-primary/20'
                                : s.planId === 'basic'
                                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                                : 'bg-secondary text-muted-foreground border-border/40'
                            }`}>
                              {s.planName}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              s.status === 'active'
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            }`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-muted-foreground">
                            {s.dailyAiQueriesUsed ?? 0} used
                          </td>
                          <td className="px-6 py-4 text-xs text-muted-foreground">
                            {s.startDate ? new Date(s.startDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                          </td>
                          <td className="px-6 py-4 text-xs text-muted-foreground">
                            {s.endDate && s.planId !== 'free'
                              ? new Date(s.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 6: PAYMENTS & REVENUE ──────────────────────────────────── */}
        {activeTab === 'revenue' && (
          <div className="space-y-6 animate-fade-up">
            {/* Revenue stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  label: 'Total Revenue',
                  value: revenueStats?.totalRevenue ?? 0,
                  sub: 'All-time paid',
                  icon: TrendingUp,
                  color: 'text-emerald-400',
                },
                {
                  label: 'This Month',
                  value: revenueStats?.monthlyRevenue ?? 0,
                  sub: 'Current month',
                  icon: Zap,
                  color: 'text-primary',
                },
                {
                  label: 'Basic Revenue',
                  value: revenueStats?.basicRevenue ?? 0,
                  sub: 'From Basic plans',
                  icon: CreditCard,
                  color: 'text-cyan-400',
                },
                {
                  label: 'Pro Revenue',
                  value: revenueStats?.proRevenue ?? 0,
                  sub: 'From Pro plans',
                  icon: CreditCard,
                  color: 'text-amber-400',
                },
              ].map((card, i) => (
                <div key={i} className="glass-strong rounded-2xl p-5 border border-border/40">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <p className={`font-display text-2xl font-extrabold ${card.color}`}>
                    Rs. {(card.value || 0).toLocaleString()}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Payments transactions table */}
            <div className="glass-strong rounded-2xl border border-border/40 overflow-hidden shadow-elegant">
              {paymentsList.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-base font-semibold">No payments yet</p>
                  <p className="text-xs mt-1">Transactions will appear here once users subscribe to a paid plan.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-secondary/50 text-xs text-muted-foreground uppercase border-b border-border/40">
                      <tr>
                        <th className="px-6 py-3.5">User</th>
                        <th className="px-6 py-3.5">Plan</th>
                        <th className="px-6 py-3.5">Amount</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5">Payment ID</th>
                        <th className="px-6 py-3.5">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {paymentsList.map((p) => (
                        <tr key={p._id} className="hover:bg-secondary/30 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-foreground">{p.user?.displayName || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{p.user?.email}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                              p.planId === 'pro'
                                ? 'bg-primary/10 text-primary border-primary/20'
                                : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                            }`}>
                              {p.planName}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-emerald-400">
                            Rs. {(p.amount || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              p.status === 'paid'
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-muted-foreground font-mono">
                            {p.paymentId?.slice(-12) || '—'}
                          </td>
                          <td className="px-6 py-4 text-xs text-muted-foreground">
                            {p.createdAt
                              ? new Date(p.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ─── Delete Confirmation Modal ───────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-up">
          <div className="glass-strong rounded-2xl max-w-md w-full p-6 border border-border/40 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Confirm Account Deletion
                </h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to permanently delete the {deleteTarget.type}{' '}
              <strong className="text-foreground">"{deleteTarget.item.displayName}"</strong>?
              All associated data (workout plans, nutrition plans, messages, and connections) will be removed.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl glass border border-border/60 text-xs font-semibold hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors shadow-glow flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    Confirm Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
