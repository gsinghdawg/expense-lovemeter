
import { PaymentStatusCheck } from './PaymentStatusCheck';

export const SubscriptionWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <PaymentStatusCheck>
      {children}
    </PaymentStatusCheck>
  );
};
