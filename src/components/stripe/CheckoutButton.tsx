
import { Button } from '@/components/ui/button';
import { STRIPE_PAYMENT_LINKS } from '@/integrations/supabase/client';

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
  buttonText,
  variant = 'default',
  className,
}: CheckoutButtonProps) => {
  // Extract the plan ID from the priceId (simplified approach)
  const getPlanIdFromPriceId = (priceId: string): string => {
    if (priceId.includes('month')) return 'monthly';
    if (priceId.includes('quarter')) return 'quarterly';
    if (priceId.includes('biannual')) return 'biannual';
    if (priceId.includes('annual')) return 'annual';
    return 'monthly'; // Default fallback
  };

  const planId = getPlanIdFromPriceId(priceId);
  
  const handleClick = () => {
    const paymentLink = STRIPE_PAYMENT_LINKS[planId];
    if (paymentLink) {
      console.log(`Redirecting to payment link: ${paymentLink}`);
      // Force open in the same window
      window.open(paymentLink, '_self');
    } else {
      console.error(`No payment link found for plan: ${planId}`);
    }
  };

  return (
    <Button
      variant={variant}
      className={className}
      onClick={handleClick}
    >
      {buttonText}
    </Button>
  );
};
