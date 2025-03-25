
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';

const CLICK_LIMIT = 40;

export const ClickTracker = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [clickCount, setClickCount] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Use our custom hook for subscription checking
  const { hasActiveSubscription, subscriptionChecked } = useSubscriptionCheck();
  
  // Track clicks in local state only (no database tracking)
  useEffect(() => {
    const handleClick = async () => {
      if (!user || hasActiveSubscription) return;
      
      try {
        // Increment click count locally
        setClickCount(prevCount => {
          const newCount = prevCount + 1;
          console.log(`Incrementing click count: ${prevCount} -> ${newCount}`);
          
          // Show paywall if reached limit
          if (newCount >= CLICK_LIMIT && !hasActiveSubscription) {
            setShowPaywall(true);
          }
          
          return newCount;
        });
      } catch (err) {
        console.error('Error tracking click:', err);
      }
    };
    
    // Only track clicks if user is logged in and doesn't have subscription
    if (user && !hasActiveSubscription) {
      document.addEventListener('click', handleClick, { capture: true });
      return () => document.removeEventListener('click', handleClick, { capture: true });
    }
  }, [user, hasActiveSubscription]);
  
  // Redirect to pricing page when paywall is shown
  useEffect(() => {
    if (showPaywall && subscriptionChecked) {
      toast({
        title: "Free Usage Limit Reached",
        description: "You've reached the 40 click limit. Please subscribe to continue.",
        variant: "destructive",
      });
      
      navigate('/pricing');
      setShowPaywall(false); // Reset after redirect
    }
  }, [showPaywall, subscriptionChecked, navigate, toast]);
  
  return <>{children}</>;
};
