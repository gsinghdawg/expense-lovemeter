
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { STRIPE_PAYMENT_LINKS } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: string;
  popular?: boolean;
}

export const PricingPlans = () => {
  const { toast } = useToast();
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

  const handlePurchase = (planId: string) => {
    // Get the payment link for this plan
    const paymentLink = STRIPE_PAYMENT_LINKS[planId];
    if (paymentLink) {
      // Redirect to Stripe hosted payment page
      console.log(`Redirecting to payment link: ${paymentLink}`);
      try {
        // Force open in same window
        window.open(paymentLink, '_self');
        
        // Backup method in case the above fails
        setTimeout(() => {
          window.location.href = paymentLink;
        }, 100);
      } catch (error) {
        console.error('Redirection error:', error);
        toast({
          title: "Redirection Issue",
          description: "There was a problem opening the payment page. Please try again.",
          variant: "destructive"
        });
      }
    } else {
      console.error(`No payment link found for plan: ${planId}`);
      toast({
        title: "Configuration Error",
        description: "Payment link not found. Please contact support.",
        variant: "destructive"
      });
    }
  };

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
            <CardFooter>
              <Button
                onClick={() => handlePurchase(tier.id)}
                className="w-full"
                variant={tier.popular ? 'default' : 'outline'}
              >
                Subscribe Now
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};
