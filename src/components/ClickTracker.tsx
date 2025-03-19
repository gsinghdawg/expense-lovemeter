
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase, saveClickCountBeforeUnload } from '@/integrations/supabase/client';
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
      // If no user, maintain the subscription state
      if (!user) {
        setSubscriptionChecked(true);
        return;
      }

      if (!isSubscriptionLoading && subscription) {
        const isActive = subscription.status === 'active' || 
                        subscription.status === 'trialing';
        console.log('User subscription status:', subscription.status, 'isActive:', isActive);
        setHasActiveSubscription(isActive);
        setSubscriptionChecked(true);
      }
    };
    
    checkSubscription();
  }, [user, subscription, isSubscriptionLoading]);

  // Persist click count to Supabase database
  const saveClickCount = async (count: number, userId: string) => {
    if (count === 0) return;
    
    try {
      console.log('Saving click count to DB:', count);
      const { error } = await supabase
        .from('user_click_counts')
        .upsert(
          { user_id: userId, click_count: count, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
      
      if (error) {
        console.error('Error saving click count:', error);
        // Try again after a short delay if there was an error
        setTimeout(() => {
          saveClickCount(count, userId);
        }, 1000);
      } else {
        console.log('Successfully saved click count to DB');
      }
    } catch (error) {
      console.error('Error updating click count:', error);
    }
  };

  // Load the click count from Supabase when component mounts or user changes
  useEffect(() => {
    const loadClickCount = async () => {
      if (!user || !subscriptionChecked) return;
      
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
          // 5. Not already on the pricing page
          if (data.click_count >= MAX_FREE_CLICKS && 
              !isExcludedPath && 
              !hasActiveSubscription && 
              location.pathname !== '/pricing') {
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

  // Add event listener for beforeunload to save the click count before the page unloads
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user && clickCount > 0) {
        // Use the helper function from client.ts for handling beforeunload events
        saveClickCountBeforeUnload(user.id, clickCount);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [clickCount, user]);

  // Save the click count to Supabase whenever it changes or when user changes
  useEffect(() => {
    // Skip saving if clickCount is 0 or no user
    if (!user || clickCount === 0) return;
    
    // Use a debounced save to prevent too many DB writes
    const timeoutId = setTimeout(() => {
      saveClickCount(clickCount, user.id);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [clickCount, user]);

  // Handle clicking anywhere in the app
  const handleClick = (e: MouseEvent) => {
    // Only count clicks if the user is authenticated and not on excluded paths
    if (!user || isExcludedPath) return;
    
    // Don't track clicks if user has active subscription, but still preserve the counter
    if (hasActiveSubscription) {
      console.log('User has active subscription, skipping click tracking');
      return;
    }
    
    // IMPORTANT: Increment click count even after reaching MAX_FREE_CLICKS
    // This ensures the counter never resets and continues to increase
    const newCount = clickCount + 1;
    console.log('Click detected, new count:', newCount);
    setClickCount(newCount);
    
    // Show notification at exactly the threshold
    if (newCount === MAX_FREE_CLICKS) {
      toast({
        title: "Free Usage Limit Reached",
        description: "You've reached the maximum number of interactions for the free plan.",
        variant: "destructive",
      });
      
      // Only redirect if not already on pricing page
      if (location.pathname !== '/pricing') {
        navigate('/pricing');
      }
    } else if (newCount > MAX_FREE_CLICKS && location.pathname !== '/pricing') {
      // Continue redirecting to pricing for any click beyond the threshold
      console.log('Redirecting to pricing page, clicks > MAX_FREE_CLICKS');
      navigate('/pricing');
    }
  };

  // Add click event listener
  useEffect(() => {
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [clickCount, user, isExcludedPath, hasActiveSubscription, location.pathname]);

  // Save click count when component unmounts
  useEffect(() => {
    return () => {
      if (user && clickCount > 0) {
        console.log('Component unmounting, saving click count:', clickCount);
        // Use immediate save with no delay during unmount
        saveClickCount(clickCount, user.id);
      }
    };
  }, [clickCount, user]);

  return <>{children}</>;
};
