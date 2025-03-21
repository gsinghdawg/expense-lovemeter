
import { ClickTracker } from './ClickTracker';
import { PaymentStatusCheck } from './PaymentStatusCheck';

export const SubscriptionWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <ClickTracker>
      <PaymentStatusCheck>
        {children}
      </PaymentStatusCheck>
    </ClickTracker>
  );
};
