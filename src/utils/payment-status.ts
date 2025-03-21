
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const usePaymentStatusCheck = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
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
        
        // Show success message
        toast({
          title: "Payment Successful!",
          description: "Thank you for your subscription. You now have full access to the app.",
          variant: "default",
        });
        
        // Short delay before redirecting
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 2000);
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
  }, [toast, navigate, user]);
};
