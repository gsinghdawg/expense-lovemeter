
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ClickTracker } from "@/components/ClickTracker";
import Index from "./pages/Index";
import Home from "./pages/Home";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import ProfileSetup from "./pages/ProfileSetup";
import Pricing from "./pages/Pricing";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Increase stale time to reduce unnecessary refetching
      staleTime: 1000 * 60 * 5, // 5 minutes
      // Enable retry for failed queries
      retry: 3,
      // Increase cache time to ensure data is available during navigation
      cacheTime: 1000 * 60 * 30, // 30 minutes
    },
  },
});

const App = () => (
  <ThemeProvider defaultTheme="light">
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {/* Routes that need click tracking */}
            <Routes>
              <Route path="/dashboard" element={
                <ClickTracker>
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                </ClickTracker>
              } />
              <Route path="/profile-setup" element={
                <ClickTracker>
                  <ProtectedRoute>
                    <ProfileSetup />
                  </ProtectedRoute>
                </ClickTracker>
              } />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/signup" element={<SignUp />} />
              {/* Routes without click tracking */}
              <Route path="/home" element={<Home />} />
              <Route path="/" element={<Home />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
