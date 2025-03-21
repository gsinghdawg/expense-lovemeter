
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { usePaymentStatusCheck } from "@/utils/payment-status";

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Add payment status check to handle redirects after payment
  usePaymentStatusCheck();

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
          <h1 className="text-4xl font-bold mb-4">Pricing Page</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            This is a simplified pricing page. Subscription functionality has been removed.
          </p>
        </div>
        
        <div className="text-center mt-8">
          <Button onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
