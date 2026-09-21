import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('fitai_token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const data = await api.get('/auth/me');
        if (data && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
          localStorage.removeItem('fitai_token');
        }
      } catch (error) {
        console.error('Failed to verify session:', error);
        localStorage.removeItem('fitai_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // User Login handler
  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    if (data.token) {
      localStorage.setItem('fitai_token', data.token);
      setUser(data.user);
    }
    return data;
  };

  // User Register handler
  const register = async (email, password, displayName) => {
    const data = await api.post('/auth/register', { email, password, displayName });
    if (data.token) {
      localStorage.setItem('fitai_token', data.token);
      setUser(data.user);
    }
    return data;
  };

  // Trainer Login handler
  const trainerLogin = async (email, password) => {
    const data = await api.post('/trainers/signin', { email, password });
    if (data.token) {
      localStorage.setItem('fitai_token', data.token);
      setUser(data.user);
    }
    return data;
  };

  // Trainer Register handler
  const trainerRegister = async (payload) => {
    const data = await api.post('/trainers/signup', payload);
    if (data.token) {
      localStorage.setItem('fitai_token', data.token);
      setUser(data.user);
    }
    return data;
  };

  // Update local user state
  const updateUserData = (partialData) => {
    setUser((prev) => (prev ? { ...prev, ...partialData } : null));
  };

  const [subscription, setSubscription] = useState(null);

  // Fetch current user subscription
  const refreshSubscription = async () => {
    const token = localStorage.getItem('fitai_token');
    if (!token) {
      setSubscription(null);
      return;
    }
    try {
      const data = await api.get('/subscriptions/me');
      if (data && data.subscription) {
        setSubscription(data.subscription);
      }
    } catch (e) {
      // Default to free if network/server issue
    }
  };

  useEffect(() => {
    if (user && user.role === 'user') {
      refreshSubscription();
    } else {
      setSubscription(null);
    }
  }, [user]);

  // Check whether current user can access a specific feature
  const canAccessFeature = (feature) => {
    if (user?.role === 'admin' || user?.role === 'trainer') return true;

    const isValid = subscription?.status === 'active' && (!subscription?.endDate || new Date(subscription.endDate) >= new Date());
    const plan = isValid ? subscription?.planId : 'free';

    switch (feature) {
      case 'personalized-routine':
      case 'nutrition-plan':
      case 'schedule':
        return plan === 'basic' || plan === 'pro';
      case 'trainer-messaging':
      case 'advanced-ai':
      case 'premium-programs':
        return plan === 'pro';
      default:
        return true;
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('fitai_token');
    setUser(null);
    setSubscription(null);
  };

  const isTrainer = user?.role === 'trainer';
  const isUser = user?.role === 'user';
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        trainerLogin,
        trainerRegister,
        updateUserData,
        logout,
        isTrainer,
        isUser,
        isAdmin,
        subscription,
        refreshSubscription,
        canAccessFeature,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
