
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "./use-toast";

// Define the Subscription type
export type Subscription = {
  id: string;
  user_id: string;
  status: string;
  plan_id: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_subscription_id: string;
  created_at?: string;
};

// Define the PaymentHistory type
export type PaymentHistory = {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
};

export const useStripe = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [isLoadingPaymentHistory, setIsLoadingPaymentHistory] = useState(true);

  // This function would be wired up to a real Stripe instance in production
  // For now, we'll simulate a subscription check
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) {
        setIsLoadingSubscription(false);
        return;
      }

      try {
        // For the demo, let's just simulate a subscription
        // In a real app, you would query your subscriptions table
        console.log("Simulating subscription check for user:", user.id);
        
        // Simulate a subscription
        const mockSubscription: Subscription = {
          id: "sub_123456",
          user_id: user.id,
          status: "active", // or 'trialing', 'past_due', 'canceled', etc.
          plan_id: "price_123456",
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          cancel_at_period_end: false,
          stripe_subscription_id: "sub_stripe_123456"
        };
        
        setSubscription(mockSubscription);
      } catch (error) {
        console.error("Error fetching subscription:", error);
        toast({
          title: "Error",
          description: "Could not fetch subscription information",
          variant: "destructive",
        });
      } finally {
        setIsLoadingSubscription(false);
      }
    };

    const fetchPaymentHistory = async () => {
      if (!user) {
        setIsLoadingPaymentHistory(false);
        return;
      }

      try {
        // Simulate payment history
        console.log("Simulating payment history for user:", user.id);
        
        // Mock payment history
        const mockPaymentHistory: PaymentHistory[] = [
          {
            id: "pay_123456",
            user_id: user.id,
            amount: 9.99,
            currency: "USD",
            status: "succeeded",
            created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: "pay_123457",
            user_id: user.id,
            amount: 9.99,
            currency: "USD",
            status: "succeeded",
            created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
        
        setPaymentHistory(mockPaymentHistory);
      } catch (error) {
        console.error("Error fetching payment history:", error);
      } finally {
        setIsLoadingPaymentHistory(false);
      }
    };

    fetchSubscription();
    fetchPaymentHistory();
  }, [user, toast]);

  return {
    subscription,
    isLoadingSubscription,
    paymentHistory,
    isLoadingPaymentHistory,
  };
};
