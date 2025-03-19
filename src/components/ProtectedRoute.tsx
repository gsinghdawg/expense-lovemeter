
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
  const [hasRecentPayment, setHasRecentPayment] = useState(false);
  const location = useLocation();
  const { subscription, isSubscriptionLoading, paymentHistory, isPaymentHistoryLoading } = useStripe();
  const { toast } = useToast();

  // Check for recent payments (within the last hour)
  useEffect(() => {
    if (!paymentHistory || isPaymentHistoryLoading) return;

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour grace period
    
    const recentSuccessfulPayment = paymentHistory.some(payment => {
      const paymentDate = new Date(payment.created_at);
      return payment.status === 'succeeded' && paymentDate > oneHourAgo;
    });
    
    setHasRecentPayment(recentSuccessfulPayment);
    
    if (recentSuccessfulPayment) {
      console.log("Recent successful payment found. Allowing access during grace period.");
    }
  }, [paymentHistory, isPaymentHistoryLoading]);

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

  // Show loading spinner while checking authentication or onboarding status
  if (isLoading || isCheckingOnboarding || isSubscriptionLoading || isPaymentHistoryLoading) {
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

  // Check for active subscription
  const hasActiveSubscription = subscription && 
    (subscription.status === 'active' || subscription.status === 'trialing');
  
  // Log subscription status for debugging
  console.log("Subscription status:", subscription?.status || "No subscription");
  console.log("Has recent payment:", hasRecentPayment);
  
  // If user doesn't have an active subscription and no recent payment,
  // and isn't on the pricing page, redirect to pricing page
  if (!hasActiveSubscription && !hasRecentPayment && location.pathname !== "/pricing") {
    // Show toast with information about the subscription issue
    if (location.pathname !== "/pricing") {
      toast({
        title: "Subscription Required",
        description: "You need an active subscription to access this area. If you just paid, please wait a moment for our system to process your payment.",
        variant: "destructive",
      });
    }
    return <Navigate to="/pricing" replace />;
  }

  // Return the children (allow access) if the user has a subscription, recent payment,
  // or is on allowed pages
  return <>{children}</>;
};

export default ProtectedRoute;
