
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { STRIPE_BUY_BUTTON_IDS, STRIPE_PUBLISHABLE_KEY } from '@/integrations/supabase/client';

interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: string;
  popular?: boolean;
}

export const PricingPlans = () => {
  const pricingTiers: PricingTier[] = [
    {
      id: 'monthly',
      name: 'Monthly',
      description: 'Full Access',
      price: '$10',
      duration: '1 month'
    },
    {
      id: 'quarterly',
      name: 'Quarterly',
      description: 'Full Access',
      price: '$25',
      popular: true,
      duration: '3 months'
    },
    {
      id: 'biannual',
      name: 'Semi-Annual',
      description: 'Full Access',
      price: '$40',
      duration: '6 months'
    },
    {
      id: 'annual',
      name: 'Annual',
      description: 'Full Access',
      price: '$50',
      duration: '12 months'
    }
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
        <h2 className="text-3xl font-bold tracking-tight">Transparent Pricing for Every Budget</h2>
        <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
          Choose the plan that works best for your financial goals. All plans include access to our core budgeting tools.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-8">
        {pricingTiers.map((tier) => (
          <Card key={tier.id} className={`flex flex-col ${tier.popular ? 'border-primary shadow-lg' : ''}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                  <CardDescription className="mt-2">{tier.description}</CardDescription>
                </div>
                {tier.popular && <Badge className="ml-2">Best Value</Badge>}
              </div>
              <div className="mt-4">
                <span className="text-3xl font-bold">{tier.price}</span>
                <span className="text-muted-foreground"> for {tier.duration}</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              {/* No feature list as per previous version */}
            </CardContent>
            <CardFooter className="flex justify-center">
              <div className="w-full" id={`stripe-button-${tier.id}`}>
                <stripe-buy-button
                  buy-button-id={STRIPE_BUY_BUTTON_IDS[tier.id]}
                  publishable-key={STRIPE_PUBLISHABLE_KEY}
                ></stripe-buy-button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};
