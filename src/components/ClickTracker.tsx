
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';

export const ClickTracker = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [showPaywall, setShowPaywall] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Use our custom hook for subscription checking
  const { hasActiveSubscription, subscriptionChecked } = useSubscriptionCheck();
  
  // Redirect to pricing page when paywall is shown
  useEffect(() => {
    if (showPaywall && subscriptionChecked) {
      toast({
        title: "Free Usage Limit Reached",
        description: "Please subscribe to continue.",
        variant: "destructive",
      });
      
      navigate('/pricing');
      setShowPaywall(false); // Reset after redirect
    }
  }, [showPaywall, subscriptionChecked, navigate, toast]);
  
  return <>{children}</>;
};
