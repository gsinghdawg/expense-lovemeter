
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Maximum number of clicks before showing paywall
const MAX_FREE_CLICKS = 40;

// Paths that should be excluded from click tracking
const EXCLUDED_PATHS = ['/', '/home', '/pricing', '/signup'];

export const ClickTracker = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [clickCount, setClickCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Check if current path should be excluded from tracking
  const isExcludedPath = EXCLUDED_PATHS.includes(location.pathname);

  // Load the click count from Supabase when component mounts or user changes
  useEffect(() => {
    const loadClickCount = async () => {
      if (!user) return;
      
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
          console.log('Loaded click count:', data.click_count);
          
          // Check if user has already reached the limit on initial load
          // Only redirect if not on an excluded path
          if (data.click_count >= MAX_FREE_CLICKS && !isExcludedPath) {
            console.log('User already reached click limit, redirecting to pricing');
            navigate('/pricing');
          }
        }
      } catch (error) {
        console.error('Error fetching click count:', error);
      }
    };
    
    loadClickCount();
  }, [user, navigate, isExcludedPath]);

  // Save the click count to Supabase when it changes
  useEffect(() => {
    const saveClickCount = async () => {
      if (!user || clickCount === 0) return;
      
      try {
        console.log('Saving click count:', clickCount);
        const { error } = await supabase
          .from('user_click_counts')
          .upsert(
            { user_id: user.id, click_count: clickCount, updated_at: new Date().toISOString() },
            { onConflict: 'user_id' }
          );
        
        if (error) {
          console.error('Error saving click count:', error);
        }
      } catch (error) {
        console.error('Error updating click count:', error);
      }
    };
    
    saveClickCount();
  }, [clickCount, user]);

  // Handle clicking anywhere in the app
  const handleClick = (e: MouseEvent) => {
    // Only count clicks if the user is authenticated and not on excluded paths
    if (!user || isExcludedPath) return;
    
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
  }, [clickCount, user, isExcludedPath]);

  return <>{children}</>;
};
