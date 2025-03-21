
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useStripe } from '@/hooks/use-stripe';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const usePaymentStatusCheck = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { refetchSubscription } = useStripe();
  const { user } = useAuth();

  useEffect(() => {
    const checkPaymentStatus = async () => {
      const url = new URL(window.location.href);
      const paymentSuccess = url.searchParams.get('payment_success');
      const paymentCancelled = url.searchParams.get('payment_cancelled');
      
      if (paymentSuccess === 'true') {
        console.log('Payment success detected in URL params');
        
        // Clean up URL
        url.searchParams.delete('payment_success');
        window.history.replaceState({}, document.title, url.toString());
        
        // Refetch subscription data immediately to ensure it's up to date
        try {
          console.log('Refetching subscription after successful payment');
          await refetchSubscription();
          
          // Reset click count after successful payment
          if (user) {
            console.log('Resetting click count after successful payment');
            try {
              const { error } = await supabase
                .from('user_click_counts')
                .upsert({
                  user_id: user.id,
                  click_count: 0,
                  updated_at: new Date().toISOString()
                });
              
              if (error) {
                console.error('Error resetting click count:', error);
              }
            } catch (err) {
              console.error('Unexpected error resetting click count:', err);
            }
          }
          
          // Show success message
          toast({
            title: "Payment Successful!",
            description: "Thank you for your subscription. You now have full access to the app.",
            variant: "default",
          });
          
          // Short delay before redirecting to make sure subscription data has time to update
          setTimeout(async () => {
            try {
              // Fetch one more time to be certain
              console.log('Final subscription check before redirect');
              await refetchSubscription();
              
              // Redirect to main app after successful payment
              console.log('Redirecting to dashboard after successful payment');
              navigate('/dashboard', { replace: true });
            } catch (err) {
              console.error('Error in final subscription check:', err);
              // Still redirect to dashboard even if final check fails
              navigate('/dashboard', { replace: true });
            }
          }, 2000);
        } catch (err) {
          console.error('Error refreshing subscription after payment:', err);
          // Still show success message and redirect
          toast({
            title: "Payment Successful!",
            description: "Thank you for your subscription. You now have full access to the app.",
            variant: "default",
          });
          
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 2000);
        }
      } else if (paymentCancelled === 'true') {
        console.log('Payment cancellation detected in URL params');
        
        // Clean up URL
        url.searchParams.delete('payment_cancelled');
        window.history.replaceState({}, document.title, url.toString());
        
        // Show cancellation message
        toast({
          title: "Payment Cancelled",
          description: "Your payment was cancelled. You can try again whenever you're ready.",
          variant: "destructive",
        });
      }
    };
    
    checkPaymentStatus();
  }, [toast, navigate, refetchSubscription, user]);
};
