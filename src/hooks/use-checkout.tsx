
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase, STRIPE_PUBLISHABLE_KEY } from '@/integrations/supabase/client';
import { useStripe } from '@/hooks/use-stripe';

// Initialize Stripe with our publishable key
console.log('Initializing Stripe with key (first 8 chars):', STRIPE_PUBLISHABLE_KEY?.substring(0, 8) || 'not set');
const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;

// Ensure the Stripe initialization is working
if (!stripePromise) {
  console.error('Failed to initialize Stripe. Please check that STRIPE_PUBLISHABLE_KEY is set correctly.');
}

interface UseCheckoutOptions {
  priceId: string;
  mode: 'payment' | 'subscription';
  successUrl?: string;
  cancelUrl?: string;
}

export const useCheckout = ({
  priceId,
  mode,
  successUrl = `${window.location.origin}/?payment_success=true`,
  cancelUrl = `${window.location.origin}/pricing?payment_cancelled=true`,
}: UseCheckoutOptions) => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { refetchSubscription } = useStripe();

  const handleCheckout = async () => {
    if (!user || !session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to subscribe to a plan",
        variant: "destructive",
      });
      return;
    }

    if (!stripePromise) {
      toast({
        title: "Configuration Error",
        description: "Stripe is not properly configured. Please check the console for details.",
        variant: "destructive",
      });
      console.error('Stripe is not properly initialized. STRIPE_PUBLISHABLE_KEY may be missing.');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('Creating checkout session with:', {
        priceId,
        mode,
        successUrl,
        cancelUrl
      });
      
      // Call the create-checkout Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId,
          mode,
          successUrl,
          cancelUrl
        }
      });

      console.log('Response from create-checkout:', data, error);
      
      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to create checkout session.');
      }
      
      if (!data) {
        throw new Error('No data returned from server');
      }

      if (data.error) {
        // Check for specific provider error
        if (data.provider_error) {
          throw new Error(data.error + ': ' + (data.details || 'Please try again later.'));
        } else {
          throw new Error(data.error);
        }
      }
      
      if (!data.sessionId) {
        throw new Error('No session ID returned from server');
      }
      
      console.log('Checkout session created:', data.sessionId);
      
      // Direct redirection method - always try this first
      if (data.url) {
        console.log('Redirecting to Stripe URL directly:', data.url);
        window.location.href = data.url;
        return;
      }
      
      // Fallback to redirectToCheckout if direct URL is not available
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Failed to load Stripe.');
      }
      
      const { error: redirectError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });
      
      if (redirectError) {
        throw redirectError;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      
      // Special handling for payment provider connection issues
      if (error.message && error.message.includes('provider cannot be reached')) {
        toast({
          title: 'Payment Provider Issue',
          description: 'We\'re having trouble connecting to our payment provider. Please try again in a few moments.',
          variant: 'destructive',
        });
        
        // If retried less than 2 times, increment count
        if (retryCount < 2) {
          setRetryCount(retryCount + 1);
        }
      } else if (error.message && error.message.includes('configuration error')) {
        toast({
          title: 'Configuration Error',
          description: 'There is an issue with the payment configuration. Please contact support.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Checkout Error',
          description: error.message || 'There was an error processing your payment. Please try again later.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleCheckout,
  };
};
