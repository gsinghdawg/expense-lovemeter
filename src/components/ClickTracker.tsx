
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
  
  // Fetch current click count when user loads the app
  useEffect(() => {
    const fetchClickCount = async () => {
      if (!user) return;
      
      try {
        // Get user's click count from database
        const { data, error } = await supabase
          .from('user_click_counts')
          .select('click_count')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          // Handle case where table might not exist or other errors
          if (error.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Error fetching click count:', error);
          }
          // Initialize local click count if we can't get it from database
          return;
        }
        
        // If user has a click count, set it
        if (data) {
          console.log('Retrieved click count:', data.click_count);
          setClickCount(data.click_count);
          // Show paywall if user is over limit and doesn't have a subscription
          if (data.click_count >= CLICK_LIMIT && !hasActiveSubscription) {
            setShowPaywall(true);
          }
        }
      } catch (err) {
        console.error('Unexpected error fetching click count:', err);
      }
    };
    
    if (user) {
      fetchClickCount();
    }
  }, [user, hasActiveSubscription]);
  
  // Track clicks and update the database
  useEffect(() => {
    const handleClick = async () => {
      if (!user || hasActiveSubscription) return;
      
      try {
        // Increment click count locally
        setClickCount(prevCount => {
          const newCount = prevCount + 1;
          console.log(`Incrementing click count: ${prevCount} -> ${newCount}`);
          
          // Try to update database with new count
          supabase
            .from('user_click_counts')
            .upsert({
              user_id: user.id, 
              click_count: newCount,
              updated_at: new Date().toISOString()
            })
            .then(({ error }) => {
              if (error) {
                console.error('Error updating click count:', error);
              }
            });
          
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
