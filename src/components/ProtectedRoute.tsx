
import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/integrations/supabase/client";
import { useStripe } from "@/hooks/use-stripe";
import { useToast } from "@/hooks/use-toast";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const { subscription, isSubscriptionLoading, refetchSubscription } = useStripe();
  const location = useLocation();
  const { toast } = useToast();

  // Check for payment success parameter in URL
  useEffect(() => {
    const url = new URL(window.location.href);
    const paymentSuccess = url.searchParams.get('payment_success');
    
    if (paymentSuccess === 'true') {
      // Refetch subscription data
      refetchSubscription();
      
      // Clean up URL
      url.searchParams.delete('payment_success');
      window.history.replaceState({}, document.title, url.toString());
    }
  }, [location.search, refetchSubscription]);

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

  if (isLoading || isCheckingOnboarding || isSubscriptionLoading) {
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

  // Removed the automatic subscription check and redirect to pricing
  // This allows users to use the app until they hit the click limit

  return <>{children}</>;
};

export default ProtectedRoute;
