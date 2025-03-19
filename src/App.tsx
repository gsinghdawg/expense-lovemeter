import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

import Home from "@/pages/Home";
import SignUp from "@/pages/SignUp";
import Pricing from "@/pages/Pricing";
import ProfileSetup from "@/pages/ProfileSetup";
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";
import PaymentTest from "@/pages/PaymentTest";

function App() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <div className="flex flex-col min-h-screen">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider defaultTheme="system" storageKey="ui-theme">
            <Toaster />
            <Router>
              <Routes>
                <Route path="/signup" element={<SignUp />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/profile-setup" element={<ProfileSetup />} />
                <Route path="/payment-test" element={<PaymentTest />} {/* Add new test route */}
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Router>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;
