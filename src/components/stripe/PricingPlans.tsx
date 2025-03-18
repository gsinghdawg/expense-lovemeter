
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckoutButton } from '@/components/stripe/CheckoutButton';
import { Badge } from '@/components/ui/badge';

interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: string;
  priceId: string;
  features: string[];
  popular?: boolean;
  mode: 'subscription';
}

export const PricingPlans = () => {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');

  const pricingTiers: PricingTier[] = [
    {
      id: 'basic',
      name: 'Basic',
      description: 'Essential features for personal budgeting',
      price: '$9.99',
      priceId: 'price_1R2frfECEgtMuXU25cEk0iVG', // Basic plan price ID
      features: [
        'Up to 50 expense entries',
        'Basic expense categories',
        'Monthly summary reports',
        'Email support'
      ],
      mode: 'subscription'
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'Advanced features for serious budgeters',
      price: '$19.99',
      priceId: 'price_1R2g0XECEgtMuXU2kVcXdMv3', // Premium plan price ID
      features: [
        'Unlimited expense entries',
        'Custom categories',
        'Advanced analytics',
        'Data export',
        'Priority support'
      ],
      popular: true,
      mode: 'subscription'
    },
    {
      id: 'business',
      name: 'Business',
      description: 'Complete solution for small businesses',
      price: '$39.99',
      priceId: billingInterval === 'monthly' 
        ? 'price_1R2g0XECEgtMuXU2ecCSvPJv' // Business monthly plan price ID
        : 'price_1R2g0XECEgtMuXU259x0lLOp', // Business yearly plan price ID
      features: [
        'Multiple user accounts',
        'Team collaboration',
        'Business categories',
        'Receipt scanning',
        'Accounting integration',
        'Dedicated support'
      ],
      mode: 'subscription'
    }
  ];

  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight">Transparent Pricing for Every Budget</h2>
        <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
          Choose the plan that works best for your financial goals. All plans include access to our core budgeting tools.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mt-8">
        {pricingTiers.map((tier) => (
          <Card key={tier.id} className={`flex flex-col ${tier.popular ? 'border-primary shadow-lg' : ''}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                  <CardDescription className="mt-2">{tier.description}</CardDescription>
                </div>
                {tier.popular && <Badge className="ml-2">Popular</Badge>}
              </div>
              <div className="mt-4">
                <span className="text-3xl font-bold">{tier.price}</span>
                <span className="text-muted-foreground"> /month</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <svg className="h-4 w-4 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <CheckoutButton
                priceId={tier.priceId}
                mode={tier.mode}
                buttonText={`Subscribe to ${tier.name}`}
                className="w-full"
                variant={tier.popular ? 'default' : 'outline'}
              />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};
