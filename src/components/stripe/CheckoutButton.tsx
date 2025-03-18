
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Initialize Stripe with the provided publishable key
const stripePromise = loadStripe('pk_live_51QzSAJECEgtMuXU2GLO1bMiyihcl0AZ4o318dV4Nbwga6d8K8M2YutpgcgV0EGHP882QgIX9MqXyaUtoXvhlZMAd00r7TMTC4R');

interface CheckoutButtonProps {
  priceId: string;
  mode: 'payment' | 'subscription';
  buttonText: string;
  successUrl?: string;
  cancelUrl?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
}

export const CheckoutButton = ({
  priceId,
  mode,
  buttonText,
  successUrl = `${window.location.origin}/dashboard?payment_success=true`,
  cancelUrl = `${window.location.origin}/dashboard?payment_cancelled=true`,
  variant = 'default',
  className,
}: CheckoutButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to subscribe to a plan",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Get Stripe.js instance
      const stripe = await stripePromise;
      
      if (!stripe) {
        throw new Error('Failed to load Stripe.');
      }
      
      // Create a checkout session directly with Stripe
      const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'success_url': successUrl,
          'cancel_url': cancelUrl,
          'mode': mode,
          'line_items[0][price]': priceId,
          'line_items[0][quantity]': '1',
          'client_reference_id': user.id,
          'customer_email': user.email || '',
        }),
      });
      
      const session = await response.json();
      
      if (!session || !session.id) {
        throw new Error('Failed to create checkout session.');
      }
      
      // Redirect to Stripe Checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId: session.id,
      });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Checkout Error',
        description: error.message || 'There was an error processing your payment.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      className={className}
      onClick={handleCheckout}
      disabled={isLoading}
    >
      {isLoading ? 'Loading...' : buttonText}
    </Button>
  );
};
