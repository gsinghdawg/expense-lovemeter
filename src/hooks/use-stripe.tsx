import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { safeTable, Subscription, PaymentHistory } from '@/integrations/supabase/custom-types';

export type { Subscription, PaymentHistory };

export const useStripe = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Fetch user's subscription with improved error handling
  const { 
    data: subscription, 
    isLoading: isSubscriptionLoading,
    refetch: refetchSubscriptionInternal
  } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async (): Promise<Subscription | null> => {
      if (!user) return null;
      
      try {
        console.log('Fetching subscription for user:', user.id);
        const { data, error } = await supabase
          .from(safeTable('subscriptions'))
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (error) {
          if (error.code !== 'PGRST116') { // No rows returned
            console.error('Error fetching subscription:', error);
          } else {
            console.log('No subscription found for user');
          }
          return null;
        }
        
        console.log('Subscription data fetched:', data);
        return data as Subscription;
      } catch (err) {
        console.error('Unexpected error fetching subscription:', err);
        return null;
      }
    },
    enabled: !!user,
  });

  // Wrapper for refetch with better logging
  const refetchSubscription = async () => {
    console.log('⚠️ Manually refetching subscription data...');
    try {
      const result = await refetchSubscriptionInternal();
      console.log('⚠️ Subscription refetch result:', result.data);
      return result;
    } catch (err) {
      console.error('Error refetching subscription:', err);
      toast({
        title: 'Error',
        description: 'Failed to refresh subscription status. Please try again.',
        variant: 'destructive',
      });
      throw err;
    }
  };

  // Fetch user's payment history
  const { 
    data: paymentHistory, 
    isLoading: isPaymentHistoryLoading,
    refetch: refetchPaymentHistory
  } = useQuery({
    queryKey: ['paymentHistory', user?.id],
    queryFn: async (): Promise<PaymentHistory[]> => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from(safeTable('payment_history'))
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching payment history:', error);
        return [];
      }
      
      return data as PaymentHistory[];
    },
    enabled: !!user,
  });

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
      const response = await supabase.functions.invoke('create-checkout', {
        body: options,
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
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
  };
};
