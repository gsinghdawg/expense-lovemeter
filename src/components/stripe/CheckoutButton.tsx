
import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase, STRIPE_PUBLISHABLE_KEY } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useStripe } from '@/hooks/use-stripe';

// Initialize Stripe with our publishable key
console.log('Initializing Stripe with key (first 8 chars):', STRIPE_PUBLISHABLE_KEY.substring(0, 8));
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

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
  successUrl = `${window.location.origin}/?payment_success=true`,
  cancelUrl = `${window.location.origin}/pricing?payment_cancelled=true`,
  variant = 'default',
  className,
}: CheckoutButtonProps) => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const navigate = useNavigate();
  const { refetchSubscription } = useStripe();

  // Check URL parameters for payment status
  useEffect(() => {
    const checkPaymentStatus = async () => {
      const url = new URL(window.location.href);
      const paymentSuccess = url.searchParams.get('payment_success');
      
      if (paymentSuccess === 'true') {
        // Clean up URL
        url.searchParams.delete('payment_success');
        window.history.replaceState({}, document.title, url.toString());
        
        // Refetch subscription data to ensure it's up to date
        await refetchSubscription();
        
        // Show success message
        toast({
          title: "Payment Successful!",
          description: "Thank you for your subscription. You now have full access to the app.",
          variant: "default",
        });
        
        // Redirect to main app after successful payment
        navigate('/', { replace: true });
      }
    };
    
    checkPaymentStatus();
  }, [toast, navigate, refetchSubscription]);

  const handleCheckout = async (retry = false) => {
    if (!user || !session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to subscribe to a plan",
        variant: "destructive",
      });
      return;
    }

    if (retry) {
      setIsRetrying(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      // Get Stripe.js instance
      const stripe = await stripePromise;
      
      if (!stripe) {
        throw new Error('Failed to load Stripe.');
      }
      
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
      
      // If direct URL is available, use it (more reliable)
      if (data.url) {
        console.log('Redirecting to Stripe URL directly:', data.url);
        window.location.href = data.url;
        return;
      }
      
      // Fallback to redirectToCheckout
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
      } else {
        toast({
          title: 'Checkout Error',
          description: error.message || 'There was an error processing your payment. Please try again later.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  };

  return (
    <Button
      variant={variant}
      className={className}
      onClick={() => handleCheckout(false)}
      disabled={isLoading || isRetrying}
    >
      {isLoading ? 'Processing...' : isRetrying ? 'Retrying...' : buttonText}
    </Button>
  );
};
