
import { useEffect } from 'react';
import { useClickTracker } from '@/hooks/use-click-tracker';

export const ClickTracker = ({ children }: { children: React.ReactNode }) => {
  // Use the custom hook to handle all click tracking logic
  const { clickCount, clickDataLoaded, hasActiveSubscription } = useClickTracker();
  
  // Log state for debugging
  useEffect(() => {
    console.log('ClickTracker state:', { 
      clickCount, 
      clickDataLoaded, 
      hasActiveSubscription 
    });
  }, [clickCount, clickDataLoaded, hasActiveSubscription]);

  return <>{children}</>;
};
