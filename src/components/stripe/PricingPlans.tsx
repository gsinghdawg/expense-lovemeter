
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
          Choose the plan that works best for you
        </p>
      </div>

      <div className="flex flex-col md:flex-row justify-center gap-8 mt-8">
        <div className="w-full max-w-[300px]">
          <div className="text-center mb-4">
            <h3 className="text-xl font-semibold">Monthly</h3>
            <p className="text-muted-foreground">$10 per month</p>
          </div>
          <div id="stripe-button-monthly" className="w-full">
            <stripe-buy-button
              buy-button-id={STRIPE_BUY_BUTTON_IDS.monthly}
              publishable-key={STRIPE_PUBLISHABLE_KEY}
            />
          </div>
        </div>
        
        <div className="w-full max-w-[300px]">
          <div className="text-center mb-4">
            <h3 className="text-xl font-semibold">Quarterly</h3>
            <p className="text-muted-foreground">$25 for 3 months</p>
          </div>
          <div id="stripe-button-quarterly" className="w-full">
            <stripe-buy-button
              buy-button-id="buy_btn_1R4U07ECEgtMuXU24vxJsFPe"
              publishable-key="pk_live_51QzSAJECEgtMuXU2GLO1bMiyihcl0AZ4o318dV4Nbwga6d8K8M2YutpgcgV0EGHP882QgIX9MqXyaUtoXvhlZMAd00r7TMTC4R"
            />
          </div>
        </div>
        
        <div className="w-full max-w-[300px]">
          <div className="text-center mb-4">
            <h3 className="text-xl font-semibold">Biannual</h3>
            <p className="text-muted-foreground">$40 for 6 months</p>
          </div>
          <div id="stripe-button-biannual" className="w-full">
            <stripe-buy-button
              buy-button-id="buy_btn_1R4U4HECEgtMuXU2iUJWTy7v"
              publishable-key="pk_live_51QzSAJECEgtMuXU2GLO1bMiyihcl0AZ4o318dV4Nbwga6d8K8M2YutpgcgV0EGHP882QgIX9MqXyaUtoXvhlZMAd00r7TMTC4R"
            />
          </div>
        </div>
        
        <div className="w-full max-w-[300px]">
          <div className="text-center mb-4">
            <h3 className="text-xl font-semibold">Annual</h3>
            <p className="text-muted-foreground">$50 for 1 year</p>
          </div>
          <div id="stripe-button-annual" className="w-full">
            <stripe-buy-button
              buy-button-id="buy_btn_1R4U6BECEgtMuXU2u8mmVj1B"
              publishable-key="pk_live_51QzSAJECEgtMuXU2GLO1bMiyihcl0AZ4o318dV4Nbwga6d8K8M2YutpgcgV0EGHP882QgIX9MqXyaUtoXvhlZMAd00r7TMTC4R"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
