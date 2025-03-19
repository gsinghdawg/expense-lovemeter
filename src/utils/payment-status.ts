
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useStripe } from '@/hooks/use-stripe';

export const usePaymentStatusCheck = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { refetchSubscription } = useStripe();

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
};
