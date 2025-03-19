
import { CheckoutButton } from './CheckoutButton';

export const PricingPlans = () => {
  // Define the pricing plan details
  const plans = [
    {
      id: 'monthly',
      name: 'Monthly',
      description: '$10 per month',
      priceId: 'price_1RmAKqECEgtMuXU2GbvgNw3l',
    },
    {
      id: 'quarterly',
      name: 'Quarterly',
      description: '$25 for 3 months',
      priceId: 'price_1RmAKrECEgtMuXU2nPiPnKBB',
    },
    {
      id: 'biannual',
      name: 'Biannual',
      description: '$40 for 6 months',
      priceId: 'price_1RmAKsECEgtMuXU2R7Q1ovQJ',
    },
    {
      id: 'annual',
      name: 'Annual',
      description: '$50 for 1 year',
      priceId: 'price_1RmAKtECEgtMuXU2rrfFrSdE',
    },
  ];

  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight">Subscription</h2>
        <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
          Choose the plan that works best for you
        </p>
      </div>

      <div className="flex flex-col md:flex-row justify-center gap-8 mt-8">
        {plans.map((plan) => (
          <div key={plan.id} className="w-full max-w-[300px] bg-card rounded-lg shadow-sm p-6 border border-border flex flex-col">
            <div className="text-center mb-4">
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              <p className="text-muted-foreground">{plan.description}</p>
            </div>
            <div className="flex-grow"></div>
            <CheckoutButton
              priceId={plan.priceId}
              buttonText={`Subscribe ${plan.name}`}
              className="w-full mt-4"
              mode="subscription"
              successUrl={`${window.location.origin}/?payment_success=true`}
              cancelUrl={`${window.location.origin}/pricing?payment_cancelled=true`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
