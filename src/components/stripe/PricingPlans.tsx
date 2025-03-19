
import { useEffect } from 'react';
import { STRIPE_BUY_BUTTON_IDS, STRIPE_PUBLISHABLE_KEY } from '@/integrations/supabase/client';

export const PricingPlans = () => {
  useEffect(() => {
    // Load Stripe Buy Button script
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/buy-button.js';
    script.async = true;
    
    // Add script to document only if it doesn't exist
    if (!document.querySelector('script[src="https://js.stripe.com/v3/buy-button.js"]')) {
      document.body.appendChild(script);
    }
    
    return () => {
      // No need to remove script on unmount as it may be used by other components
    };
  }, []);

  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight">Subscription</h2>
        <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
          Get full access for only $10 per month
        </p>
      </div>

      <div className="flex justify-center mt-8">
        <div className="w-full max-w-[300px]">
          <div id="stripe-button-monthly" className="w-full">
            <stripe-buy-button
              buy-button-id={STRIPE_BUY_BUTTON_IDS.monthly}
              publishable-key={STRIPE_PUBLISHABLE_KEY}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
