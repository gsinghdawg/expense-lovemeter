
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
  duration: string;
}

export const PricingPlans = () => {
  const pricingTiers: PricingTier[] = [
    {
      id: 'monthly',
      name: 'Monthly',
      description: 'Full Access',
      price: '$10',
      priceId: 'price_1R2frfECEgtMuXU25cEk0iVG', // Monthly plan price ID
      features: [
        'Up to 50 expense entries',
        'Basic expense categories',
        'Monthly summary reports',
        'Email support'
      ],
      mode: 'subscription',
      duration: '1 month'
    },
    {
      id: 'quarterly',
      name: 'Quarterly',
      description: 'Full Access',
      price: '$25',
      priceId: 'price_1R2g0XECEgtMuXU2kVcXdMv3', // Quarterly plan price ID
      features: [
        'Unlimited expense entries',
        'Custom categories',
        'Advanced analytics',
        'Data export',
        'Priority support'
      ],
      popular: true,
      mode: 'subscription',
      duration: '3 months'
    },
    {
      id: 'biannual',
      name: 'Semi-Annual',
      description: 'Full Access',
      price: '$40',
      priceId: 'price_1R2g0XECEgtMuXU2ecCSvPJv', // Swapped - now using Annual plan price ID
      features: [
        'Multiple user accounts',
        'Team collaboration',
        'Business categories',
        'Receipt scanning',
        'Accounting integration',
        'Priority support'
      ],
      mode: 'subscription',
      duration: '6 months'
    },
    {
      id: 'annual',
      name: 'Annual',
      description: 'Full Access',
      price: '$50',
      priceId: 'price_1R2g0XECEgtMuXU259x0lLOp', // Swapped - now using Biannual plan price ID
      features: [
        'All Semi-Annual features',
        'Year-end financial reporting',
        'Dedicated account manager',
        'Custom financial insights',
        'API access',
        'VIP support'
      ],
      mode: 'subscription',
      duration: '12 months'
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
                buttonText={`Subscribe Now`}
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
