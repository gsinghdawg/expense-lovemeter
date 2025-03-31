
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// This is a mock implementation for development
export function useSubscription() {
  const [isLoading, setIsLoading] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      console.log(`Simulating subscription check for user: ${user.id}`);
      
      // Simulate fetching subscription data
      setTimeout(() => {
        const mockSubscription = {
          id: 'sub_mock123',
          status: 'active',
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          items: {
            data: [
              {
                price: {
                  id: 'price_mock123',
                  product: 'prod_mock123',
                  unit_amount: 999,
                  currency: 'usd',
                  recurring: {
                    interval: 'month'
                  }
                }
              }
            ]
          }
        };
        
        setSubscription(mockSubscription);
        setIsLoading(false);
        console.log("User subscription status:", mockSubscription.status, "isActive:", mockSubscription.status === 'active');
      }, 500);
    }
  }, [user]);

  return {
    subscription,
    isLoading
  };
}
