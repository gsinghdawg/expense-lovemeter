import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';
import { ThemeProvider } from "@/components/theme-provider"
import { useAuth } from './contexts/AuthContext';
import Index from './pages/Index';
import SignUp from './pages/SignUp';
import Home from './pages/Home';
import Pricing from './pages/Pricing';
import ProfileSetup from './pages/ProfileSetup';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import Settings from './pages/Settings';

function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="loading loading-spinner text-primary"></span>
      </div>
    );
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/profile-setup" element={<ProfileSetup />} />
        <Route path="/settings" element={<Settings />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
