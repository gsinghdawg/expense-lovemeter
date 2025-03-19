
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
  const { subscription, isSubscriptionLoading, paymentHistory, isPaymentHistoryLoading, refetchSubscription } = useStripe();
  const { toast } = useToast();

  // Refetch subscription data periodically when payment detected but subscription not active
  useEffect(() => {
    // Only poll if there's a recent payment but no active subscription
    if (hasRecentPayment && !subscription?.status) {
      console.log("Payment detected but subscription not active yet, polling for updates...");
      const pollingInterval = setInterval(() => {
        refetchSubscription();
      }, 5000); // Poll every 5 seconds
      
      return () => clearInterval(pollingInterval);
    }
  }, [hasRecentPayment, subscription, refetchSubscription]);

  // Check for recent payments (within the last hour)
  useEffect(() => {
    if (!paymentHistory || isPaymentHistoryLoading) return;

    const now = new Date();
    // Extend grace period to 6 hours to handle longer processing times
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000); 
    
    const recentSuccessfulPayment = paymentHistory.some(payment => {
      const paymentDate = new Date(payment.created_at);
      return payment.status === 'succeeded' && paymentDate > sixHoursAgo;
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
  
  // Allow access if user has active subscription, recent payment, or is on the pricing page
  if (hasActiveSubscription || hasRecentPayment || location.pathname === "/pricing") {
    return <>{children}</>;
  }
  
  // If there's no active subscription and no recent payment,
  // redirect to pricing page with a toast message
  if (location.pathname !== "/pricing") {
    toast({
      title: "Subscription Required",
      description: "You need an active subscription to access this area. If you just paid, please wait a moment for our system to process your payment.",
      variant: "destructive",
    });
  }
  
  return <Navigate to="/pricing" replace />;
};

export default ProtectedRoute;
