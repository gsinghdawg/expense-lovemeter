
import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/spinner";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, userProfile } = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    console.log("ProtectedRoute: User state:", user ? "Authenticated" : "Not authenticated");
    console.log("ProtectedRoute: Current path:", location.pathname);
    console.log("ProtectedRoute: Profile completed:", userProfile?.onboarding_completed);
  }, [user, location.pathname, userProfile]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    console.log("ProtectedRoute: No user, redirecting to /signup");
    return <Navigate to="/signup" replace />;
  }

  // If user has a profile but onboarding is not completed and they're not already on profile setup page
  if (user && userProfile && userProfile.onboarding_completed === false && location.pathname !== "/profile-setup") {
    console.log("ProtectedRoute: Profile not complete, redirecting to /profile-setup");
    return <Navigate to="/profile-setup" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
