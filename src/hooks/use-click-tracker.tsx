
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { saveClickCount, saveClickCountBeforeUnload } from '@/utils/click-utils';
import { useSubscriptionCheck } from '@/hooks/use-subscription-check';
import { supabase } from '@/integrations/supabase/client';

// Maximum number of clicks before showing paywall
const MAX_FREE_CLICKS = 40;

// Paths that should be excluded from click tracking
const EXCLUDED_PATHS = ['/', '/home', '/pricing', '/signup'];

export const useClickTracker = () => {
  const { user } = useAuth();
  const [clickCount, setClickCount] = useState(0);
  const [clickDataLoaded, setClickDataLoaded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { hasActiveSubscription, subscriptionChecked } = useSubscriptionCheck();

  // Check if current path should be excluded from tracking
  const isExcludedPath = EXCLUDED_PATHS.includes(location.pathname);

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
        
        // Mark click data as loaded even if there was no data
        setClickDataLoaded(true);
      } catch (error) {
        console.error('Error fetching click count:', error);
        // Even on error, mark as loaded to prevent infinite loading state
        setClickDataLoaded(true);
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
    if (!user || clickCount === 0 || !clickDataLoaded) return;
    
    // Use a debounced save to prevent too many DB writes
    const timeoutId = setTimeout(() => {
      saveClickCount(clickCount, user.id);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [clickCount, user, clickDataLoaded]);

  // Handle clicking anywhere in the app
  const handleClick = (e: MouseEvent) => {
    // Only count clicks if the user is authenticated and not on excluded paths
    if (!user || isExcludedPath || !clickDataLoaded) return;
    
    // Don't track clicks if user has active subscription, but still preserve the counter
    if (hasActiveSubscription) {
      console.log('User has active subscription, skipping click tracking');
      return;
    }
    
    // Never reset the counter - always increment by 1
    // This ensures the counter never resets and continues to increase
    const newCount = clickCount + 1;
    console.log('Click detected, new count:', newCount);
    setClickCount(newCount);
    
    // Save the click count before showing notification or redirecting
    if (user && newCount > 0) {
      // Save immediately before potentially redirecting
      saveClickCount(newCount, user.id);
    }
    
    // Show notification and redirect at exactly the threshold
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

  // Setup and teardown click tracking
  useEffect(() => {
    if (clickDataLoaded) { // Only add listener after click data is loaded
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [clickCount, user, isExcludedPath, hasActiveSubscription, location.pathname, clickDataLoaded]);

  // Save click count when component unmounts
  useEffect(() => {
    return () => {
      if (user && clickCount > 0 && clickDataLoaded) {
        console.log('Component unmounting, saving click count:', clickCount);
        // Use immediate save with no delay during unmount
        saveClickCount(clickCount, user.id);
      }
    };
  }, [clickCount, user, clickDataLoaded]);

  return {
    clickCount,
    clickDataLoaded,
    hasActiveSubscription
  };
};
