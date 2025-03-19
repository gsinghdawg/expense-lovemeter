
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PricingPlans } from "@/components/stripe/PricingPlans";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePaymentStatusCheck } from "@/utils/payment-status";
import { useStripe } from "@/hooks/use-stripe";
import { SubscriptionManager } from "@/components/stripe/SubscriptionManager";
import { PaymentHistory } from "@/components/stripe/PaymentHistory";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/integrations/supabase/client";

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { subscription, isSubscriptionLoading, paymentHistory, isPaymentHistoryLoading, refetchSubscription, refetchPaymentHistory } = useStripe();
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [hasRecentPayment, setHasRecentPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pollingCount, setPollingCount] = useState(0);
  const [directPayments, setDirectPayments] = useState<any[]>([]);
  const [isLoadingDirectPayments, setIsLoadingDirectPayments] = useState(false);
  const [isManuallyChecking, setIsManuallyChecking] = useState(false);
  
  usePaymentStatusCheck();

  // Poll for subscription updates if payment is detected
  useEffect(() => {
    if ((hasRecentPayment || directPayments.length > 0 || isManuallyChecking) && !hasActiveSubscription && pollingCount < 20) {
      const timer = setTimeout(() => {
        console.log(`Polling for subscription updates (attempt ${pollingCount + 1}/20)...`);
        refetchSubscription();
        refetchPaymentHistory();
        checkDirectPayments();
        setPollingCount(prev => prev + 1);
      }, 3000); // Poll every 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, [hasRecentPayment, directPayments, hasActiveSubscription, pollingCount, isManuallyChecking, refetchSubscription, refetchPaymentHistory]);

  // More thorough check for direct payments in Supabase
  const checkDirectPayments = async () => {
    if (!user) return;
    
    setIsLoadingDirectPayments(true);
    try {
      console.log("Checking for direct payments in database...");
      const { data, error } = await supabase
        .from('payment_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) {
        console.error("Error checking direct payments:", error);
        throw error;
      }
      
      console.log("Payment history from database:", data);
      
      if (data && data.length > 0) {
        console.log("Direct payments found:", data);
        setDirectPayments(data);
        
        // Check for recent payments (within the last 24 hours)
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        const hasRecentDirectPayment = data.some(payment => {
          const paymentDate = new Date(payment.created_at);
          const isRecent = paymentDate > twentyFourHoursAgo;
          const isSuccessful = payment.status === 'succeeded';
          
          console.log(`Payment ${payment.id}: date=${paymentDate}, isRecent=${isRecent}, isSuccessful=${isSuccessful}`);
          
          return isSuccessful && isRecent;
        });
        
        if (hasRecentDirectPayment) {
          setHasRecentPayment(true);
          if (!isProcessing) {
            toast({
              title: "Payment Found",
              description: "We've found a recent payment for your account. You should now have access to all features!",
            });
          }
        }
      } else {
        console.log("No direct payments found in database");
      }
    } catch (err) {
      console.error("Error checking direct payments:", err);
    } finally {
      setIsLoadingDirectPayments(false);
    }
  };

  // Check direct payments on load
  useEffect(() => {
    if (user) {
      checkDirectPayments();
    }
  }, [user]);

  useEffect(() => {
    if (subscription && ['active', 'trialing'].includes(subscription.status)) {
      setHasActiveSubscription(true);
    } else {
      setHasActiveSubscription(false);
    }
  }, [subscription]);

  useEffect(() => {
    if (!paymentHistory || isPaymentHistoryLoading) return;

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    const recentSuccessfulPayment = paymentHistory.some(payment => {
      const paymentDate = new Date(payment.created_at);
      return payment.status === 'succeeded' && paymentDate > twentyFourHoursAgo;
    });
    
    setHasRecentPayment(recentSuccessfulPayment);
    
    if (recentSuccessfulPayment && !hasActiveSubscription && !isProcessing) {
      setIsProcessing(true);
      toast({
        title: "Payment Processing",
        description: "Your payment has been received and your subscription is being activated. This may take a few moments.",
      });
      
      // Redirect after a short delay
      const timer = setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 10000); // 10 seconds
      
      return () => clearTimeout(timer);
    }
  }, [paymentHistory, isPaymentHistoryLoading, hasActiveSubscription, navigate, isProcessing, toast]);

  // Check for recent direct payments
  useEffect(() => {
    if (!directPayments.length) return;
    
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const hasRecentDirectPayment = directPayments.some(payment => {
      const paymentDate = new Date(payment.created_at);
      return payment.status === 'succeeded' && paymentDate > twentyFourHoursAgo;
    });
    
    if (hasRecentDirectPayment && !hasActiveSubscription && !isProcessing) {
      setIsProcessing(true);
      toast({
        title: "Payment Received",
        description: "Your payment has been received and you now have access to all features!",
      });
      
      // Redirect after a short delay
      const timer = setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 5000); // 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [directPayments, hasActiveSubscription, navigate, isProcessing, toast]);

  useEffect(() => {
    if (!user) {
      navigate('/signup', { replace: true });
    }
  }, [user, navigate]);

  const handleBackToHome = () => {
    navigate('/', { replace: true });
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard', { replace: true });
  };

  const handleManualCheck = () => {
    setIsManuallyChecking(true);
    refetchSubscription();
    refetchPaymentHistory();
    checkDirectPayments();
    toast({
      title: "Checking Payment Status",
      description: "We're checking your payment status. This may take a moment...",
    });
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-10">
          <Button 
            variant="ghost" 
            className="flex items-center gap-2" 
            onClick={handleBackToHome}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4">Gain Full Access</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            
          </p>
        </div>

        {hasActiveSubscription && (
          <div className="mb-10">
            <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-800 dark:text-green-400">Active Subscription</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                You already have an active subscription. You have full access to all features.
              </AlertDescription>
              <div className="mt-4">
                <Button onClick={handleGoToDashboard} className="bg-green-600 hover:bg-green-700 text-white">
                  Go to Dashboard
                </Button>
              </div>
            </Alert>
            <div className="mt-8">
              <SubscriptionManager />
            </div>
          </div>
        )}

        {(hasRecentPayment || directPayments.length > 0) && !hasActiveSubscription && (
          <div className="mb-10">
            <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
              <Loader2 className="h-5 w-5 text-yellow-600 dark:text-yellow-400 animate-spin" />
              <AlertTitle className="text-yellow-800 dark:text-yellow-400">Payment Processing</AlertTitle>
              <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                Thank you for your payment! Your subscription is being processed. This may take a few moments.
                You'll be redirected to the dashboard shortly.
              </AlertDescription>
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <Button onClick={handleGoToDashboard} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                  Go to Dashboard Now
                </Button>
                <Button variant="outline" onClick={handleManualCheck}>
                  Check Payment Status
                </Button>
              </div>
            </Alert>
            <div className="mt-8">
              <PaymentHistory limit={5} />
            </div>
          </div>
        )}
        
        {!hasActiveSubscription && !hasRecentPayment && directPayments.length === 0 && 
          !isSubscriptionLoading && !isPaymentHistoryLoading && !isLoadingDirectPayments && (
            <div>
              <div className="mb-6">
                <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                  <AlertTitle className="text-blue-800 dark:text-blue-400">Purchase a Subscription</AlertTitle>
                  <AlertDescription className="text-blue-700 dark:text-blue-300">
                    Select a plan below to gain access to all features. If you've already purchased but don't see your subscription,
                    use the 'Check Payment Status' button.
                  </AlertDescription>
                  {isManuallyChecking ? (
                    <div className="mt-4 flex items-center gap-2">
                      <Spinner size="sm" className="text-blue-600" />
                      <span className="text-blue-700 dark:text-blue-300">Checking payment status...</span>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <Button variant="outline" onClick={handleManualCheck} className="border-blue-400 text-blue-700 hover:bg-blue-100">
                        Check Payment Status
                      </Button>
                    </div>
                  )}
                </Alert>
              </div>
              <PricingPlans />
            </div>
          )}
        
        {(isSubscriptionLoading || isPaymentHistoryLoading || isLoadingDirectPayments) && (
          <div className="flex justify-center my-20">
            <Spinner size="lg" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Pricing;
