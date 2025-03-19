
import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

// Initialize Stripe with the provided test key
const stripePromise = loadStripe('pk_test_51QzSAJECEgtMuXU2UJ8hDINkw43JABnVFmbispZpwtT4HGK2ZIj4tuhb5STL48ERAnr1KOUb5KtCDtxS31IsQzjg009FXBPWY7');

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
  const navigate = useNavigate();

  // Check URL parameters for payment status
  useEffect(() => {
    const url = new URL(window.location.href);
    const paymentSuccess = url.searchParams.get('payment_success');
    
    if (paymentSuccess === 'true') {
      // Clean up URL
      url.searchParams.delete('payment_success');
      window.history.replaceState({}, document.title, url.toString());
      
      // Show success message
      toast({
        title: "Payment Successful!",
        description: "Thank you for your subscription. You now have full access to the app.",
        variant: "default",
      });
      
      // Redirect to dashboard after successful payment
      navigate('/dashboard');
    }
  }, [toast, navigate]);

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
      
      if (error || !data?.sessionId) {
        console.error('Edge function error:', error);
        throw new Error('Failed to create checkout session.');
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
