import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { FloatingChat } from './components/FloatingChat';
import { ToastContainer } from './components/Toast';

import { Home } from './pages/Home';
import { Workouts } from './pages/Workouts';
import { Nutrition } from './pages/Nutrition';
import { Chatbot } from './pages/Chatbot';
import { Dashboard } from './pages/Dashboard';
import { About } from './pages/About';
import { Auth } from './pages/Auth';
import { Pricing } from './pages/Pricing';
import { Trainers } from './pages/Trainers';
import { TrainerProfilePublic } from './pages/TrainerProfilePublic';
import { TrainerSignUp } from './pages/TrainerSignUp';
import { TrainerSignIn } from './pages/TrainerSignIn';
import { TrainerDashboard } from './pages/TrainerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { NotFound } from './pages/NotFound';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/workouts" element={<Workouts />} />
              <Route path="/nutrition" element={<Nutrition />} />
              <Route path="/trainers" element={<Trainers />} />
              <Route path="/trainers/:id" element={<TrainerProfilePublic />} />
              <Route path="/chatbot" element={<Chatbot />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/about" element={<About />} />
              <Route path="/auth" element={<Auth />} />

              {/* Trainer Portal & Protected Dashboard Routes */}
              <Route path="/trainer/signup" element={<TrainerSignUp />} />
              <Route path="/trainer/signin" element={<TrainerSignIn />} />
              <Route path="/trainer/dashboard" element={<TrainerDashboard />} />
              <Route path="/trainer/clients" element={<TrainerDashboard />} />
              <Route path="/trainer/requests" element={<TrainerDashboard />} />
              <Route path="/trainer/workouts" element={<TrainerDashboard />} />
              <Route path="/trainer/nutrition" element={<TrainerDashboard />} />
              <Route path="/trainer/profile" element={<TrainerDashboard />} />
              <Route path="/trainer/messages" element={<TrainerDashboard />} />

              {/* Hidden Admin Dashboard */}
              <Route path="/admin/dashboard" element={<AdminDashboard />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
          <FloatingChat />
          <ToastContainer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
