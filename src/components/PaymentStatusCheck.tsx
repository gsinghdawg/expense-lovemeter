
import { usePaymentStatusCheck } from '@/utils/payment-status';

export const PaymentStatusCheck = ({ children }: { children: React.ReactNode }) => {
  // Use the payment status check hook
  usePaymentStatusCheck();
  
  return <>{children}</>;
};
