// Main App component with routing
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthProvider, useAuth } from './hooks/useAuth';

// Pages (to be created)
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import WorkoutsPage from './pages/WorkoutsPage';
import NutritionPage from './pages/NutritionPage';
import ChatbotPage from './pages/ChatbotPage';
import AboutPage from './pages/AboutPage';

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/workouts" element={<WorkoutsPage />} />
      <Route path="/nutrition" element={<NutritionPage />} />
      <Route path="/chatbot" element={<ChatbotPage />} />
      <Route path="/about" element={<AboutPage />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-background text-foreground">
          <Navbar />
          <main className="flex-1">
            <AppRoutes />
          </main>
          <Footer />
          <Toaster position="top-right" theme="dark" />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
