import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { useStripe } from '@/hooks/use-stripe';
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
  const { createCheckoutSession } = useStripe();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Check for payment success or cancel query params
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('payment_success') === 'true') {
      toast({
        title: 'Payment Successful',
        description: 'Thank you for your purchase!',
      });
      
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete('payment_success');
      window.history.replaceState({}, '', url);
    } else if (searchParams.get('payment_cancelled') === 'true') {
      toast({
        title: 'Payment Cancelled',
        description: 'Your payment was cancelled.',
      });
      
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete('payment_cancelled');
      window.history.replaceState({}, '', url);
    }
  }, [toast]);

  const handleCheckout = async () => {
    setIsLoading(true);
    
    try {
      // Get Stripe.js instance
      const stripe = await stripePromise;
      
      if (!stripe) {
        throw new Error('Failed to load Stripe.');
      }
      
      // Create checkout session
      const sessionId = await createCheckoutSession({
        priceId,
        mode,
        successUrl,
        cancelUrl,
      });
      
      if (!sessionId) {
        throw new Error('Failed to create checkout session.');
      }
      
      // Redirect to Stripe Checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId,
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
