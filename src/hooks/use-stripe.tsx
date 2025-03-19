
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface Subscription {
  id: string;
  status: string;
  plan_id: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_subscription_id: string;
}

export interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  payment_method?: string;
  description?: string;
}

export const useStripe = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Fetch user's subscription
  const { 
    data: subscription, 
    isLoading: isSubscriptionLoading,
    refetch: refetchSubscription,
    error: subscriptionError
  } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async (): Promise<Subscription | null> => {
      if (!user) return null;
      
      console.log("Fetching subscription for user:", user.id);
      
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (error) {
          if (error.code !== 'PGRST116') { // No rows returned
            console.error('Error fetching subscription:', error);
          } else {
            console.log("No subscription found for user");
          }
          return null;
        }
        
        console.log("Subscription found:", data);
        return data;
      } catch (error) {
        console.error('Error in subscription query:', error);
        return null;
      }
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 1, // 1 minute
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });

  // Log subscription errors
  useEffect(() => {
    if (subscriptionError) {
      console.error("Subscription fetch error:", subscriptionError);
    }
  }, [subscriptionError]);

  // Fetch user's payment history
  const { 
    data: paymentHistory, 
    isLoading: isPaymentHistoryLoading,
    refetch: refetchPaymentHistory,
    error: paymentHistoryError
  } = useQuery({
    queryKey: ['paymentHistory', user?.id],
    queryFn: async (): Promise<PaymentHistory[]> => {
      if (!user) return [];
      
      console.log("Fetching payment history for user:", user.id);
      
      try {
        const { data, error } = await supabase
          .from('payment_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching payment history:', error);
          return [];
        }
        
        console.log("Payment history found:", data?.length || 0, "records");
        return data || [];
      } catch (error) {
        console.error('Error in payment history query:', error);
        return [];
      }
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 1, // 1 minute
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });

  // Log payment history errors
  useEffect(() => {
    if (paymentHistoryError) {
      console.error("Payment history fetch error:", paymentHistoryError);
    }
  }, [paymentHistoryError]);

  // Create a checkout session
  const createCheckoutSession = async (options: {
    priceId: string;
    mode: 'payment' | 'subscription';
    successUrl: string;
    cancelUrl: string;
  }) => {
    if (!user || !session) {
      toast({
        title: 'Authentication required',
        description: 'You need to be logged in to make a purchase.',
        variant: 'destructive',
      });
      return null;
    }
    
    setLoading(true);
    
    try {
      console.log("Creating checkout session with options:", options);
      
      const response = await supabase.functions.invoke('create-checkout', {
        body: options,
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      console.log("Checkout session created:", response.data);
      return response.data.sessionId;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: 'Checkout Error',
        description: error.message || 'There was an error creating the checkout session.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Redirect to Stripe customer portal
  const redirectToCustomerPortal = async (returnUrl: string) => {
    if (!user || !session) {
      toast({
        title: 'Authentication required',
        description: 'You need to be logged in to access the customer portal.',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await supabase.functions.invoke('customer-portal', {
        body: { returnUrl },
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Error redirecting to customer portal:', error);
      toast({
        title: 'Portal Error',
        description: error.message || 'There was an error accessing the customer portal.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Manage subscription
  const manageSubscription = async (action: 'cancel' | 'reactivate' | 'cancel_immediately') => {
    if (!user || !session || !subscription) {
      toast({
        title: 'Subscription Required',
        description: 'You need to have an active subscription to perform this action.',
        variant: 'destructive',
      });
      return false;
    }
    
    setLoading(true);
    
    try {
      const response = await supabase.functions.invoke('manage-subscription', {
        body: {
          action,
          subscriptionId: subscription.stripe_subscription_id,
        },
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      // Refetch subscription data
      await refetchSubscription();
      
      toast({
        title: 'Success',
        description: `Your subscription has been ${action === 'cancel' ? 'set to cancel at the end of the billing period' : 
                       action === 'reactivate' ? 'reactivated' : 'cancelled immediately'}.`,
      });
      
      return true;
    } catch (error) {
      console.error('Error managing subscription:', error);
      toast({
        title: 'Subscription Error',
        description: error.message || 'There was an error managing your subscription.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Manual function to directly check the database for payments
  const checkForDirectPayments = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      console.log("Manually checking for direct payments in database");
      const { data, error } = await supabase
        .from('payment_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        console.log("Direct payments found during manual check:", data);
        
        // Check for recent payments (within the last 24 hours)
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        const hasRecentDirectPayment = data.some(payment => {
          const paymentDate = new Date(payment.created_at);
          return payment.status === 'succeeded' && paymentDate > twentyFourHoursAgo;
        });
        
        if (hasRecentDirectPayment) {
          console.log("Recent payment found during manual check");
          return true;
        }
      }
      
      console.log("No recent payments found during manual check");
      return false;
    } catch (error) {
      console.error('Error during manual payment check:', error);
      return false;
    }
  };

  return {
    loading,
    subscription,
    isSubscriptionLoading,
    paymentHistory,
    isPaymentHistoryLoading,
    createCheckoutSession,
    redirectToCustomerPortal,
    manageSubscription,
    refetchSubscription,
    refetchPaymentHistory,
    checkForDirectPayments,
  };
};
