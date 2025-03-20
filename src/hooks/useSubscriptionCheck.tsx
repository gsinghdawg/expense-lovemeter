
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useStripe } from '@/hooks/use-stripe';

// Paths that should be excluded from subscription checking
const EXCLUDED_PATHS = ['/', '/home', '/pricing', '/signup'];

export const useSubscriptionCheck = () => {
  const { user } = useAuth();
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { subscription, isSubscriptionLoading } = useStripe();

  // Check if current path should be excluded from checking
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

      try {
        if (!isSubscriptionLoading && subscription) {
          const isActive = subscription.status === 'active' || 
                          subscription.status === 'trialing';
          console.log('User subscription status:', subscription.status, 'isActive:', isActive);
          setHasActiveSubscription(isActive);
        } else {
          // Fallback to free tier if subscription data is not available
          console.log('No subscription data available, treating as free tier');
          setHasActiveSubscription(false);
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        setHasActiveSubscription(false);
      }
      
      setSubscriptionChecked(true);
    };
    
    checkSubscription();
  }, [user, subscription, isSubscriptionLoading]);

  return {
    hasActiveSubscription,
    subscriptionChecked,
    isExcludedPath
  };
};
