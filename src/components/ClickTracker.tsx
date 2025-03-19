
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useStripe } from '@/hooks/use-stripe';

// Maximum number of clicks before showing paywall
const MAX_FREE_CLICKS = 40;

// Paths that should be excluded from click tracking
const EXCLUDED_PATHS = ['/', '/home', '/pricing', '/signup'];

export const ClickTracker = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [clickCount, setClickCount] = useState(0);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { subscription, isSubscriptionLoading, refetchSubscription } = useStripe();

  // Check if current path should be excluded from tracking
  const isExcludedPath = EXCLUDED_PATHS.includes(location.pathname);

  // Check if user has an active subscription
  useEffect(() => {
    const checkSubscription = async () => {
      // If no user, reset subscription state
      if (!user) {
        setHasActiveSubscription(false);
        setSubscriptionChecked(true);
        return;
      }

      if (!isSubscriptionLoading && subscription) {
        const isActive = subscription.status === 'active' || 
                        subscription.status === 'trialing';
        console.log('User subscription status:', subscription.status, 'isActive:', isActive);
        setHasActiveSubscription(isActive);
        
        // If user has a newly active subscription but previously hit the paywall,
        // reset their click count in the database
        if (isActive && clickCount >= MAX_FREE_CLICKS) {
          console.log('Resetting click count for subscribed user');
          try {
            await supabase
              .from('user_click_counts')
              .upsert(
                { user_id: user.id, click_count: 0, updated_at: new Date().toISOString() },
                { onConflict: 'user_id' }
              );
            setClickCount(0);
          } catch (error) {
            console.error('Error resetting click count:', error);
          }
        }
        setSubscriptionChecked(true);
      }
    };
    
    checkSubscription();
  }, [user, subscription, isSubscriptionLoading, clickCount]);

  // Load the click count from Supabase when component mounts or user changes
  useEffect(() => {
    const loadClickCount = async () => {
      if (!user || !subscriptionChecked) return;
      
      // If user has an active subscription, we don't need to track clicks
      if (hasActiveSubscription) {
        console.log('User has active subscription, skipping click count load');
        return;
      }
      
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
          console.log('Loaded click count from DB:', data.click_count);
          setClickCount(data.click_count);
          
          // Only redirect if:
          // 1. Not on an excluded path
          // 2. User has no active subscription
          // 3. User has reached the click limit
          // 4. We're done checking subscription status
          if (data.click_count >= MAX_FREE_CLICKS && 
              !isExcludedPath && 
              !hasActiveSubscription) {
            console.log('User reached click limit and has no subscription, redirecting to pricing');
            navigate('/pricing');
          }
        }
      } catch (error) {
        console.error('Error fetching click count:', error);
      }
    };
    
    loadClickCount();
  }, [user, navigate, isExcludedPath, hasActiveSubscription, subscriptionChecked, location.pathname]);

  // Save the click count to Supabase when it changes, but not on every render
  useEffect(() => {
    // Skip saving if clickCount is 0 or user has subscription
    if (!user || clickCount === 0 || hasActiveSubscription) return;
    
    const saveClickCount = async () => {
      try {
        console.log('Saving click count to DB:', clickCount);
        const { error } = await supabase
          .from('user_click_counts')
          .upsert(
            { user_id: user.id, click_count: clickCount, updated_at: new Date().toISOString() },
            { onConflict: 'user_id' }
          );
        
        if (error) {
          console.error('Error saving click count:', error);
        } else {
          console.log('Successfully saved click count to DB');
        }
      } catch (error) {
        console.error('Error updating click count:', error);
      }
    };
    
    // Use a small timeout to prevent too many DB writes
    const timeoutId = setTimeout(() => {
      saveClickCount();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [clickCount, user, hasActiveSubscription]);

  // Handle clicking anywhere in the app
  const handleClick = (e: MouseEvent) => {
    // Only count clicks if the user is authenticated and not on excluded paths
    if (!user || isExcludedPath) return;
    
    // Don't count clicks or show paywall if user has active subscription
    if (hasActiveSubscription) {
      console.log('User has active subscription, skipping click tracking');
      return;
    }
    
    // Increment click count
    const newCount = clickCount + 1;
    console.log('Click detected, new count:', newCount);
    setClickCount(newCount);
    
    // Check if user has reached the limit
    if (newCount === MAX_FREE_CLICKS) {
      toast({
        title: "Free Usage Limit Reached",
        description: "You've reached the maximum number of interactions for the free plan.",
        variant: "destructive",
      });
      navigate('/pricing');
    } else if (newCount > MAX_FREE_CLICKS) {
      console.log('Redirecting to pricing page, clicks > MAX_FREE_CLICKS');
      navigate('/pricing');
    }
  };

  // Add click event listener
  useEffect(() => {
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [clickCount, user, isExcludedPath, hasActiveSubscription]);

  return <>{children}</>;
};
