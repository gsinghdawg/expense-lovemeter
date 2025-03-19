
import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PricingPlans } from "@/components/stripe/PricingPlans";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStripe } from "@/hooks/use-stripe";

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { subscription, isSubscriptionLoading } = useStripe();

  // Check if payment was cancelled
  useEffect(() => {
    const url = new URL(window.location.href);
    const paymentCancelled = url.searchParams.get('payment_cancelled');
    
    if (paymentCancelled === 'true') {
      // Clean up URL
      url.searchParams.delete('payment_cancelled');
      window.history.replaceState({}, document.title, url.toString());
      
      toast({
        title: "Payment Cancelled",
        description: "Your payment was cancelled. You can try again whenever you're ready.",
        variant: "destructive",
      });
    }
  }, [location.search, toast]);

  // Check if user has an active subscription
  useEffect(() => {
    if (!isSubscriptionLoading && subscription?.status === 'active') {
      navigate('/', { replace: true });
      toast({
        title: "Subscription Active",
        description: "You already have an active subscription. Redirecting to the app.",
      });
    }
  }, [subscription, isSubscriptionLoading, navigate, toast]);

  // Redirect to signup if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/signup', { replace: true });
    }
  }, [user, navigate]);

  const handleBackToHome = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-10 flex justify-between items-center">
          <Button 
            variant="ghost" 
            className="flex items-center gap-2" 
            onClick={handleBackToHome}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => navigate('/settings')}
          >
            <Settings className="h-4 w-4" />
            API Settings
          </Button>
        </div>
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4">Upgrade Your LadyLedger Experience</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Subscribe to continue using LadyLedger and unlock premium features.
          </p>
        </div>
        
        <PricingPlans />
      </div>
    </div>
  );
};

export default Pricing;
