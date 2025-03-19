
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { STRIPE_BUY_BUTTON_IDS, STRIPE_PUBLISHABLE_KEY } from '@/integrations/supabase/client';

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
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  
  // Extract the plan ID from the priceId (simplified approach)
  const getPlanIdFromPriceId = (priceId: string): string => {
    if (priceId.includes('month')) return 'monthly';
    if (priceId.includes('quarter')) return 'quarterly';
    if (priceId.includes('biannual')) return 'biannual';
    if (priceId.includes('annual')) return 'annual';
    return 'monthly'; // Default fallback
  };

  const planId = getPlanIdFromPriceId(priceId);
  const buyButtonId = STRIPE_BUY_BUTTON_IDS[planId];
  
  useEffect(() => {
    // Load Stripe Buy Button script
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/buy-button.js';
    script.async = true;
    document.body.appendChild(script);
    
    // Create buy button element when script is loaded
    script.onload = () => {
      if (buttonContainerRef.current) {
        // Clear previous content
        buttonContainerRef.current.innerHTML = '';
        
        // Create Stripe Buy Button element
        const buyButton = document.createElement('stripe-buy-button');
        buyButton.setAttribute('buy-button-id', buyButtonId);
        buyButton.setAttribute('publishable-key', STRIPE_PUBLISHABLE_KEY);
        
        // Append to container
        buttonContainerRef.current.appendChild(buyButton);
      }
    };
    
    return () => {
      // Cleanup script on unmount
      document.body.removeChild(script);
    };
  }, [buyButtonId]);
  
  return (
    <div 
      ref={buttonContainerRef} 
      className={`w-full ${className}`}
      aria-label={buttonText}
    ></div>
  );
};
