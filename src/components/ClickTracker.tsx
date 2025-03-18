
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Maximum number of clicks before showing paywall
const MAX_FREE_CLICKS = 40;

export const ClickTracker = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [clickCount, setClickCount] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load the click count from Supabase when component mounts
  useEffect(() => {
    const loadClickCount = async () => {
      if (!user) return;
      
      try {
        // The table name should be specified as a string literal type
        const { data, error } = await supabase
          .from('user_click_counts')
          .select('click_count')
          .eq('user_id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') { // Not found error
          console.error('Error loading click count:', error);
          return;
        }
        
        if (data) {
          setClickCount(data.click_count);
        }
      } catch (error) {
        console.error('Error fetching click count:', error);
      }
    };
    
    loadClickCount();
  }, [user]);

  // Save the click count to Supabase when it changes
  useEffect(() => {
    const saveClickCount = async () => {
      if (!user || clickCount === 0) return;
      
      try {
        const { error } = await supabase
          .from('user_click_counts')
          .upsert(
            { user_id: user.id, click_count: clickCount },
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
    // Only count clicks if the user is authenticated
    if (!user) return;
    
    // Exclude clicks on the paywall page itself
    if (window.location.pathname.includes('/pricing')) return;
    
    // Increment click count
    const newCount = clickCount + 1;
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
      navigate('/pricing');
    }
  };

  // Add click event listener
  useEffect(() => {
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [clickCount]);

  return <>{children}</>;
};
