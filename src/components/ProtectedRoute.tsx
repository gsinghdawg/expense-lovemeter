
import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/integrations/supabase/client";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        setIsCheckingOnboarding(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        setOnboardingCompleted(data?.onboarding_completed || false);
      } catch (error) {
        console.error("Error checking onboarding status:", error);
        // Default to not completed if there's an error
        setOnboardingCompleted(false);
      } finally {
        setIsCheckingOnboarding(false);
      }
    };

    if (user && !isLoading) {
      checkOnboardingStatus();
    } else if (!isLoading) {
      setIsCheckingOnboarding(false);
    }
  }, [user, isLoading]);

  if (isLoading || isCheckingOnboarding) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Redirect to signup if no user
  if (!user) {
    return <Navigate to="/signup" replace />;
  }

  // If onboarding is not completed and we're not already on the profile setup page,
  // redirect to profile setup
  if (onboardingCompleted === false && location.pathname !== "/profile-setup") {
    return <Navigate to="/profile-setup" replace />;
  }

  // Allow full access to the app regardless of subscription status
  return <>{children}</>;
};

export default ProtectedRoute;
