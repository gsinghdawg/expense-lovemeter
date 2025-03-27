
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/integrations/supabase/client";

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(true);

  // Fetch subscription details
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) {
        setSubscription(null);
        setIsSubscriptionLoading(false);
        return;
      }

      try {
        setIsSubscriptionLoading(true);
        
        // Fetch the subscription data from Supabase
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows returned" error
          console.error('Error fetching subscription:', error);
        }
        
        setSubscription(data || null);
      } catch (error) {
        console.error('Error in subscription fetch:', error);
      } finally {
        setIsSubscriptionLoading(false);
      }
    };

    fetchSubscription();
  }, [user]);

  return {
    subscription,
    isSubscriptionLoading,
    isSubscribed: subscription?.status === 'active' || subscription?.status === 'trialing',
  };
};

export default useSubscription;
