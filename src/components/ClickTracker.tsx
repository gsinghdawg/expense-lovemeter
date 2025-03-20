
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
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { subscription, isSubscriptionLoading, refetchSubscription } = useStripe();

  // Check if current path should be excluded from tracking
  const isExcludedPath = EXCLUDED_PATHS.includes(location.pathname);

  // Debug state changes
  useEffect(() => {
    console.log('⚠️ ClickTracker: clickCount changed to', clickCount);
  }, [clickCount]);

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
        
        // ⚠️ IMPORTANT: DO NOT RESET CLICK COUNT HERE OR ANYWHERE ELSE
        setSubscriptionChecked(true);
      }
    };
    
    checkSubscription();
  }, [user, subscription, isSubscriptionLoading]);

  // Load the click count from Supabase when component mounts or user changes
  useEffect(() => {
    const loadClickCount = async () => {
      if (!user || !subscriptionChecked) return;
      
      try {
        console.log('Loading click count from DB for user:', user.id);
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
        } else {
          console.log('No click count record found for user');
          // Initialize with 0 if no record exists
          const { error: insertError } = await supabase
            .from('user_click_counts')
            .insert({ user_id: user.id, click_count: 0 });
            
          if (insertError) {
            console.error('Error initializing click count:', insertError);
          }
        }
        
        // Mark initial load as complete to prevent race conditions
        setInitialLoadDone(true);
      } catch (error) {
        console.error('Error fetching click count:', error);
        setInitialLoadDone(true);
      }
    };
    
    loadClickCount();
  }, [user, navigate, isExcludedPath, hasActiveSubscription, subscriptionChecked, location.pathname]);

  // Save the click count to Supabase when it changes, but not on every render
  useEffect(() => {
    // Skip saving if clickCount is 0 or no user is logged in or initial load not done
    if (!user || clickCount === 0 || !initialLoadDone) return;
    
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
  }, [clickCount, user, initialLoadDone]);

  // Handle clicking anywhere in the app
  const handleClick = (e: MouseEvent) => {
    console.log('🖱️ Click detected, checking conditions...');
    
    // Only count clicks if the user is authenticated and not on excluded paths
    if (!user) {
      console.log('No user, skipping click tracking');
      return;
    }
    
    if (isExcludedPath) {
      console.log('On excluded path, skipping click tracking');
      return;
    }
    
    if (!initialLoadDone) {
      console.log('Initial load not done, skipping click tracking');
      return;
    }
    
    // Check if user has an active subscription - if so, still count clicks but don't show paywall
    if (hasActiveSubscription) {
      console.log('User has active subscription, tracking click but not showing paywall');
      setClickCount(prevCount => {
        const newCount = prevCount + 1;
        console.log(`Incrementing click count: ${prevCount} -> ${newCount}`);
        return newCount;
      });
      return;
    }
    
    // Increment click count
    setClickCount(prevCount => {
      const newCount = prevCount + 1;
      console.log(`Incrementing click count: ${prevCount} -> ${newCount}`);
      
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
      
      return newCount;
    });
  };

  // Add click event listener
  useEffect(() => {
    // Only attach the click handler after initial load is complete
    if (!initialLoadDone) {
      console.log('Initial load not done, not attaching click handler yet');
      return;
    }
    
    console.log('Adding click event listener, current count:', clickCount);
    
    // Use the document object instead of window for more reliable click detection
    document.addEventListener('click', handleClick, { capture: true });
    
    // Cleanup function
    return () => {
      console.log('Removing click event listener');
      document.removeEventListener('click', handleClick, { capture: true });
    };
  }, [clickCount, user, isExcludedPath, hasActiveSubscription, initialLoadDone, navigate]);

  return <>{children}</>;
};
