
import { useEffect } from 'react';
import { STRIPE_PUBLISHABLE_KEY } from '@/integrations/supabase/client';

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
          Get full access for only $25 for 3 months
        </p>
      </div>

      <div className="flex justify-center mt-8">
        <div className="w-full max-w-[300px]">
          <div id="stripe-button-quarterly" className="w-full">
            <stripe-buy-button
              buy-button-id="buy_btn_1R4U07ECEgtMuXU24vxJsFPe"
              publishable-key="pk_live_51QzSAJECEgtMuXU2GLO1bMiyihcl0AZ4o318dV4Nbwga6d8K8M2YutpgcgV0EGHP882QgIX9MqXyaUtoXvhlZMAd00r7TMTC4R"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
