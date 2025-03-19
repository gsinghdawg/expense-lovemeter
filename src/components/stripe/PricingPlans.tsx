
import { useEffect } from 'react';
import { STRIPE_PAYMENT_LINKS } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export const PricingPlans = () => {
  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight">Subscription Plans</h2>
        <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
          Choose the plan that works best for you
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 justify-center">
        <PlanCard 
          title="Monthly" 
          price="$10"
          description="/month"
          features={["Full app access", "All features", "Email support"]}
          paymentLink={STRIPE_PAYMENT_LINKS.monthly}
        />
        
        <PlanCard 
          title="Quarterly" 
          price="$25"
          description="for 3 months"
          features={["Full app access", "All features", "Email support", "Save 16%"]}
          paymentLink={STRIPE_PAYMENT_LINKS.quarterly}
          highlight
        />
        
        <PlanCard 
          title="Biannual" 
          price="$40"
          description="for 6 months"
          features={["Full app access", "All features", "Priority support", "Save 33%"]}
          paymentLink={STRIPE_PAYMENT_LINKS.biannual}
        />
        
        <PlanCard 
          title="Annual" 
          price="$50"
          description="for 1 year"
          features={["Full app access", "All features", "Priority support", "Save 58%"]}
          paymentLink={STRIPE_PAYMENT_LINKS.annual}
          highlight
        />
      </div>
    </div>
  );
};

interface PlanCardProps {
  title: string;
  price: string;
  description: string;
  features: string[];
  paymentLink: string;
  highlight?: boolean;
}

const PlanCard = ({ title, price, description, features, paymentLink, highlight }: PlanCardProps) => {
  return (
    <Card className={`flex flex-col ${highlight ? 'border-primary shadow-lg' : ''}`}>
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <div className="mt-2">
          <span className="text-3xl font-bold">{price}</span>
          <span className="text-muted-foreground"> {description}</span>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 h-4 w-4 text-primary"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          variant={highlight ? "default" : "outline"}
          onClick={() => window.location.href = paymentLink}
        >
          Subscribe
        </Button>
      </CardFooter>
    </Card>
  );
};
