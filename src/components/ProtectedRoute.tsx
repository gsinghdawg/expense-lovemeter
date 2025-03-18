
import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/spinner";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, profileData } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // If user is not logged in, redirect to signup page
  if (!user) {
    return <Navigate to="/signup" replace />;
  }

  // If user is logged in but hasn't completed onboarding and isn't already on the onboarding page
  if (profileData && profileData.onboarding_completed === false && location.pathname !== "/onboarding") {
    console.log("User hasn't completed onboarding, redirecting to onboarding page");
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
