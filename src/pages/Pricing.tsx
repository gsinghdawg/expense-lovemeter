
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

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { subscription, isSubscriptionLoading, paymentHistory, isPaymentHistoryLoading, refetchSubscription } = useStripe();
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [hasRecentPayment, setHasRecentPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pollingCount, setPollingCount] = useState(0);
  
  usePaymentStatusCheck();

  // Poll for subscription updates if payment is detected
  useEffect(() => {
    if (hasRecentPayment && !hasActiveSubscription && pollingCount < 10) {
      const timer = setTimeout(() => {
        console.log(`Polling for subscription updates (attempt ${pollingCount + 1}/10)...`);
        refetchSubscription();
        setPollingCount(prev => prev + 1);
      }, 3000); // Poll every 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, [hasRecentPayment, hasActiveSubscription, pollingCount, refetchSubscription]);

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
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000); // 6 hours ago
    
    const recentSuccessfulPayment = paymentHistory.some(payment => {
      const paymentDate = new Date(payment.created_at);
      return payment.status === 'succeeded' && paymentDate > sixHoursAgo;
    });
    
    setHasRecentPayment(recentSuccessfulPayment);
    
    if (recentSuccessfulPayment && !hasActiveSubscription && !isProcessing) {
      setIsProcessing(true);
      
      // Redirect after a short delay
      const timer = setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 5000); // 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [paymentHistory, isPaymentHistoryLoading, hasActiveSubscription, navigate, isProcessing]);

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

        {hasRecentPayment && !hasActiveSubscription && (
          <div className="mb-10">
            <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
              <Loader2 className="h-5 w-5 text-yellow-600 dark:text-yellow-400 animate-spin" />
              <AlertTitle className="text-yellow-800 dark:text-yellow-400">Payment Processing</AlertTitle>
              <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                Thank you for your payment! Your subscription is being processed. This may take a few moments.
                You'll be redirected to the dashboard shortly.
              </AlertDescription>
              <div className="mt-4">
                <Button onClick={handleGoToDashboard} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                  Go to Dashboard Now
                </Button>
              </div>
            </Alert>
            <div className="mt-8">
              <PaymentHistory limit={3} />
            </div>
          </div>
        )}
        
        {!hasActiveSubscription && !hasRecentPayment && !isSubscriptionLoading && !isPaymentHistoryLoading && <PricingPlans />}
        
        {(isSubscriptionLoading || isPaymentHistoryLoading) && (
          <div className="flex justify-center my-20">
            <Spinner size="lg" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Pricing;
