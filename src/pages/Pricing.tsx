
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PricingPlans } from "@/components/stripe/PricingPlans";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect to signup if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/signup', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-10">
          <Button 
            variant="ghost" 
            className="flex items-center gap-2" 
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4">Upgrade Your LadyLedger Experience</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            You've reached the free usage limit. Subscribe to continue using LadyLedger and unlock premium features.
          </p>
        </div>
        
        <PricingPlans />
      </div>
    </div>
  );
};

export default Pricing;
