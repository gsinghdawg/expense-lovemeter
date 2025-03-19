
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
  const [pollingCount, setPollingCount] = useState(0);
  const [isManuallyChecking, setIsManuallyChecking] = useState(false);
  const [isCheckingDirectPayment, setIsCheckingDirectPayment] = useState(true);
  const [directPaymentFound, setDirectPaymentFound] = useState(false);

  // More aggressive checking for direct payments in Supabase
  useEffect(() => {
    const checkDirectPayment = async () => {
      if (!user) {
        setIsCheckingDirectPayment(false);
        return;
      }
      
      try {
        console.log("Directly checking payment_history table for user:", user.id);
        
        // Query payment_history table directly for recent payments with a longer timeframe (24 hours)
        const { data, error } = await supabase
          .from('payment_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (error) {
          console.error("Error checking payment history:", error);
          throw error;
        }
        
        console.log("Payment history data from direct check:", data);
        
        if (data && data.length > 0) {
          const now = new Date();
          const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hour grace period
          
          const recentPayment = data.some(payment => {
            const paymentDate = new Date(payment.created_at);
            const isRecent = paymentDate > twentyFourHoursAgo;
            const isSuccessful = payment.status === 'succeeded';
            
            console.log(`Payment ${payment.id}: date=${paymentDate}, isRecent=${isRecent}, isSuccessful=${isSuccessful}`);
            
            return isSuccessful && isRecent;
          });
          
          if (recentPayment) {
            console.log("Recent payment found in database. Allowing access.");
            setDirectPaymentFound(true);
            setHasRecentPayment(true);
            
            // Show a confirmation toast
            toast({
              title: "Payment Verified",
              description: "We've confirmed your recent payment. You now have full access.",
            });
          }
        } else {
          console.log("No payment records found for this user");
        }
      } catch (err) {
        console.error("Error checking payment history:", err);
      } finally {
        setIsCheckingDirectPayment(false);
      }
    };
    
    // Always run this check when the component mounts if user is available
    if (user && !isLoading) {
      checkDirectPayment();
    }
  }, [user, isLoading, toast]);

  // Poll for subscription updates if we detect recent payment but no active subscription
  useEffect(() => {
    // If we have a recent payment but no active subscription, poll for updates
    if ((hasRecentPayment || directPaymentFound || isManuallyChecking) && !subscription && pollingCount < 10) {
      const timer = setTimeout(() => {
        console.log(`Polling for subscription updates (attempt ${pollingCount + 1}/10)...`);
        refetchSubscription();
        setPollingCount(prev => prev + 1);
      }, 3000); // Check every 3 seconds, up to 10 times
      
      return () => clearTimeout(timer);
    }
  }, [hasRecentPayment, directPaymentFound, isManuallyChecking, subscription, pollingCount, refetchSubscription]);

  // Check for recent payments (within the last 24 hours)
  useEffect(() => {
    if (!paymentHistory || isPaymentHistoryLoading) return;

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hour grace period
    
    const recentSuccessfulPayment = paymentHistory.some(payment => {
      const paymentDate = new Date(payment.created_at);
      return payment.status === 'succeeded' && paymentDate > twentyFourHoursAgo;
    });
    
    if (recentSuccessfulPayment) {
      console.log("Recent successful payment found. Allowing access during grace period.");
      setHasRecentPayment(true);
      // If we find a recent payment but no subscription, start polling
      if (!subscription) {
        setIsManuallyChecking(true);
      }
    } else {
      setHasRecentPayment(false);
    }
  }, [paymentHistory, isPaymentHistoryLoading, subscription]);

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
  if (isLoading || isCheckingOnboarding || isSubscriptionLoading || isPaymentHistoryLoading || isCheckingDirectPayment) {
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
  console.log("Direct payment found:", directPaymentFound);
  
  // If user doesn't have an active subscription and no recent payment,
  // and isn't on the pricing page, redirect to pricing page
  if (!hasActiveSubscription && !hasRecentPayment && !directPaymentFound && location.pathname !== "/pricing") {
    // Show toast with information about the subscription issue
    toast({
      title: "Subscription Required",
      description: "You need an active subscription to access this area. If you just paid, please wait a moment for our system to process your payment.",
      variant: "destructive",
    });
    return <Navigate to="/pricing" replace />;
  }

  // Return the children (allow access) if the user has a subscription, recent payment,
  // or is on allowed pages
  return <>{children}</>;
};

export default ProtectedRoute;
