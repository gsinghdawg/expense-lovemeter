
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PricingPlans } from "@/components/stripe/PricingPlans";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clickCount, setClickCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Maximum allowed clicks before paywall
  const MAX_FREE_CLICKS = 40;

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
          
          // If user hasn't reached the click limit, redirect to home
          if (data.click_count < MAX_FREE_CLICKS) {
            navigate('/', { replace: true });
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
            You've reached the free usage limit ({clickCount}/{MAX_FREE_CLICKS} clicks). 
            Subscribe to continue using LadyLedger and unlock premium features.
          </p>
        </div>
        
        <PricingPlans />
      </div>
    </div>
  );
};

export default Pricing;
