
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PricingPlans } from "@/components/stripe/PricingPlans";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePaymentStatusCheck } from "@/utils/payment-status";
import { useStripe } from "@/hooks/use-stripe";

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { subscription, isSubscriptionLoading, refetchSubscription } = useStripe();
  
  // Add payment status check to handle redirects after payment
  usePaymentStatusCheck();

  // Redirect to signup if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/signup', { replace: true });
    }
  }, [user, navigate]);

  // Handle subscription check and automatic redirect
  useEffect(() => {
    if (subscription && (subscription.status === 'active' || subscription.status === 'trialing')) {
      toast({
        title: "Active Subscription Detected",
        description: "You already have an active subscription. Redirecting to dashboard.",
      });
      
      // Short delay before redirecting to ensure toast is visible
      const timer = setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 2500);
      
      return () => clearTimeout(timer);
    }
  }, [subscription, navigate, toast]);

  const handleBackToHome = () => {
    navigate('/', { replace: true });
  };

  const handleRefreshSubscription = async () => {
    await refetchSubscription();
    toast({
      title: "Subscription Status Refreshed",
      description: "Your subscription status has been updated."
    });
  };

  // If user has an active subscription, show appropriate message
  if (subscription && (subscription.status === 'active' || subscription.status === 'trialing')) {
    return (
      <div className="min-h-screen px-4 py-8 flex flex-col items-center justify-center">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Subscription Active</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            You already have an active subscription. You have full access to all features.
          </p>
        </div>
        <Button onClick={() => navigate('/dashboard')}>
          Go to Dashboard
        </Button>
      </div>
    );
  }

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
            Subscribe to remove usage limits and get full access to all features.
          </p>
        </div>
        
        <PricingPlans />
        
        {subscription && subscription.status === 'canceled' && (
          <div className="text-center mt-8">
            <p className="text-muted-foreground mb-4">
              Your previous subscription has been canceled. Subscribe again to regain access.
            </p>
            <Button onClick={handleRefreshSubscription}>
              Refresh Subscription Status
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pricing;
