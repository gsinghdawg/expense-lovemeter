
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useCheckout } from '@/hooks/use-checkout';
import { usePaymentStatusCheck } from '@/utils/payment-status';

interface CheckoutButtonProps {
  priceId: string;
  mode: 'payment' | 'subscription';
  buttonText: string;
  successUrl?: string;
  cancelUrl?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
}

export const CheckoutButton = ({
  priceId,
  mode,
  buttonText,
  successUrl = `${window.location.origin}/?payment_success=true`,
  cancelUrl = `${window.location.origin}/pricing?payment_cancelled=true`,
  variant = 'default',
  className,
}: CheckoutButtonProps) => {
  // Check for payment status in URL (success/cancel)
  usePaymentStatusCheck();
  
  // Use the checkout hook for handling the payment process
  const { isLoading, handleCheckout } = useCheckout({
    priceId,
    mode,
    successUrl,
    cancelUrl
  });

  return (
    <Button
      variant={variant}
      className={className}
      onClick={handleCheckout}
      disabled={isLoading}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <Spinner size="sm" /> Processing...
        </span>
      ) : (
        buttonText
      )}
    </Button>
  );
};
