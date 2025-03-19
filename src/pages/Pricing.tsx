
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PricingPlans } from "@/components/stripe/PricingPlans";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useStripe } from "@/hooks/use-stripe";

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [clickCount, setClickCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { subscription, isSubscriptionLoading } = useStripe();

  // Maximum allowed clicks before paywall
  const MAX_FREE_CLICKS = 40;

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

  // Check if user has reached the click limit
  useEffect(() => {
    const checkClickCount = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_click_counts')
          .select('click_count')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error loading click count:', error);
          return;
        }

        if (data) {
          setClickCount(data.click_count);
          
          // If user hasn't reached the click limit, show that info but don't redirect
          if (data.click_count < MAX_FREE_CLICKS) {
            toast({
              title: "Free Usage Available",
              description: `You still have ${MAX_FREE_CLICKS - data.click_count} free interactions left.`
            });
          }
        }
      } catch (error) {
        console.error('Error fetching click count:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkClickCount();
  }, [user, navigate, toast]);

  // Redirect to signup if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/signup', { replace: true });
    }
  }, [user, navigate]);

  const handleBackToHome = () => {
    // Simply navigate to home page - click tracking is now disabled on home route
    navigate('/', { replace: true });
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
          <h1 className="text-4xl font-bold mb-4">Upgrade Your LadyLedger Experience</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {clickCount >= MAX_FREE_CLICKS 
              ? `You've reached the free usage limit (${clickCount}/${MAX_FREE_CLICKS} clicks).` 
              : "Upgrade to unlock premium features and unlimited usage."} 
            Subscribe to continue using LadyLedger and unlock premium features.
          </p>
        </div>
        
        <PricingPlans />
      </div>
    </div>
  );
};

export default Pricing;
