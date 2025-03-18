
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Spinner } from "@/components/ui/spinner";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading: authLoading } = useAuth();
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (!user) {
        setIsCheckingProfile(false);
        return;
      }

      try {
        console.log("Checking profile completion for user:", user.id);
        const { data, error } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Error checking profile:", error);
          setProfileComplete(false);
        } else {
          console.log("Profile data:", data);
          setProfileComplete(data?.onboarding_completed || false);
        }
      } catch (error) {
        console.error("Profile check error:", error);
        setProfileComplete(false);
      } finally {
        setIsCheckingProfile(false);
      }
    };

    if (user) {
      checkProfileCompletion();
    } else {
      setIsCheckingProfile(false);
    }
  }, [user]);

  // Show loading spinner while checking authentication and profile
  if (authLoading || isCheckingProfile) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // If not logged in, redirect to signup
  if (!user) {
    console.log("No user found, redirecting to /signup");
    return <Navigate to="/signup" replace />;
  }

  // If profile is not complete and not already on the profile setup page, redirect to profile setup
  if (!profileComplete && location.pathname !== "/profile-setup") {
    console.log("Profile not complete, redirecting to /profile-setup");
    return <Navigate to="/profile-setup" replace />;
  }

  // If on profile setup but profile is already complete, redirect to dashboard
  if (profileComplete && location.pathname === "/profile-setup") {
    console.log("Profile already complete, redirecting to /dashboard");
    return <Navigate to="/dashboard" replace />;
  }

  console.log("Rendering protected route children");
  return <>{children}</>;
};

export default ProtectedRoute;
