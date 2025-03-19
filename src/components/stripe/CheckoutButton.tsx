
import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useStripe } from '@/hooks/use-stripe';

// Initialize Stripe with the key from environment variable
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51QzSAJECEgtMuXU2UJ8hDINkw43JABnVFmbispZpwtT4HGK2ZIj4tuhb5STL48ERAnr1KOUb5KtCDtxS31IsQzjg009FXBPWY7');

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
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
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
      
      if (error || !data?.sessionId) {
        console.error('Edge function error:', error);
        throw new Error(error?.message || 'Failed to create checkout session.');
      }
      
      console.log('Checkout session created:', data.sessionId);
      
      // Redirect to Stripe Checkout
      const { error: redirectError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });
      
      if (redirectError) {
        throw redirectError;
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
