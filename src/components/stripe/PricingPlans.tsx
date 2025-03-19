
import { useEffect } from 'react';
import { STRIPE_BUY_BUTTON_IDS, STRIPE_PUBLISHABLE_KEY } from '@/integrations/supabase/client';

export const PricingPlans = () => {
  const pricingTiers = [
    { id: 'monthly' },
    { id: 'quarterly' },
    { id: 'biannual' },
    { id: 'annual' }
  ];

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
        <h2 className="text-3xl font-bold tracking-tight">Subscription Options</h2>
        <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
          Choose a plan to get started.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-8 mt-8">
        {pricingTiers.map((tier) => (
          <div key={tier.id} className="w-full max-w-[300px]">
            <div id={`stripe-button-${tier.id}`} className="w-full">
              <stripe-buy-button
                buy-button-id={STRIPE_BUY_BUTTON_IDS[tier.id]}
                publishable-key={STRIPE_PUBLISHABLE_KEY}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
