
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PricingPlans } from "@/components/stripe/PricingPlans";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePaymentStatusCheck } from "@/utils/payment-status";
import { useStripe } from "@/hooks/use-stripe";
import { SubscriptionManager } from "@/components/stripe/SubscriptionManager";

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { subscription, isSubscriptionLoading } = useStripe();
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  
  // Add payment status check to handle redirects after payment
  usePaymentStatusCheck();

  // Check subscription status
  useEffect(() => {
    if (subscription && ['active', 'trialing'].includes(subscription.status)) {
      setHasActiveSubscription(true);
    } else {
      setHasActiveSubscription(false);
    }
  }, [subscription]);

  // Redirect to signup if not logged in
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
        
        {!hasActiveSubscription && !isSubscriptionLoading && <PricingPlans />}
      </div>
    </div>
  );
};

export default Pricing;
