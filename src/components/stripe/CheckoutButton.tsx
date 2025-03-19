
import { Button } from '@/components/ui/button';
import { useCheckout } from '@/hooks/use-checkout';

interface CheckoutButtonProps {
  priceId: string;
  mode?: 'payment' | 'subscription';
  buttonText: string;
  successUrl?: string;
  cancelUrl?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
}

export const CheckoutButton = ({
  priceId,
  mode = 'subscription',
  buttonText,
  successUrl,
  cancelUrl,
  variant = 'default',
  className,
}: CheckoutButtonProps) => {
  const { isLoading, handleCheckout } = useCheckout({
    priceId,
    mode,
    successUrl,
    cancelUrl,
  });

  return (
    <Button
      variant={variant}
      className={className}
      onClick={handleCheckout}
      disabled={isLoading}
    >
      {isLoading ? 'Processing...' : buttonText}
    </Button>
  );
};
