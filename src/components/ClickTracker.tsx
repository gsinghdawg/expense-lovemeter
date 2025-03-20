
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';

export const ClickTracker = ({ children }: { children: React.ReactNode }) => {
  // Use our custom hook for subscription checking
  useSubscriptionCheck();
  
  return <>{children}</>;
};
