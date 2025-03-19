
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStripe } from '@/hooks/use-stripe';

export const useSubscriptionCheck = () => {
  const { user } = useAuth();
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  const { subscription, isSubscriptionLoading } = useStripe();

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

  return {
    hasActiveSubscription,
    subscriptionChecked
  };
};
