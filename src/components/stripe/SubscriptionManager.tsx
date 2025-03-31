
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomerPortal } from "@/hooks/stripe/useCustomerPortal";
import { useSubscription } from "@/hooks/stripe/useSubscription";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";

export function SubscriptionManager() {
  const { user } = useAuth();
  const { openCustomerPortal, isLoading: isPortalLoading } = useCustomerPortal();
  
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const { 
    subscription, 
    isLoading: isSubscriptionLoading
  } = useSubscription();

  const subscriptionId = subscription?.id;
  const subscriptionStatus = subscription?.status;
  const isSubscribed = subscriptionStatus === 'active' || subscriptionStatus === 'trialing';

  const handleCancelSubscription = async () => {
    if (!subscriptionId) return;
    
    try {
      setIsCancelling(true);
      // Mock implementation
      console.log("Canceling subscription", subscriptionId);
      
      toast({
        title: "Subscription cancelled",
        description: "Your subscription has been cancelled.",
      });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!subscriptionId) return;
    
    try {
      setIsReactivating(true);
      // Mock implementation
      console.log("Reactivating subscription", subscriptionId);
      
      toast({
        title: "Subscription reactivated",
        description: "Your subscription has been reactivated.",
      });
    } catch (error) {
      console.error("Error reactivating subscription:", error);
      toast({
        title: "Error",
        description: "Failed to reactivate subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsReactivating(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated.",
        variant: "destructive",
      });
      return;
    }

    try {
      await openCustomerPortal();
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast({
        title: "Error",
        description: "Failed to open customer portal. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isSubscriptionLoading) {
    return (
      <div className="flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isSubscribed ? (
        <>
          <p>Your subscription is currently active.</p>
          <div className="flex gap-2">
            <Button onClick={handleManageSubscription}>
              Manage Subscription
            </Button>
            {subscriptionStatus !== 'canceled' && (
              <Button 
                variant="destructive" 
                onClick={handleCancelSubscription} 
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <>
                    Cancelling <Spinner size="sm" className="ml-2" />
                  </>
                ) : (
                  "Cancel Subscription"
                )}
              </Button>
            )}
            {subscriptionStatus === 'canceled' && (
              <Button 
                variant="secondary"
                onClick={handleReactivateSubscription}
                disabled={isReactivating}
              >
                {isReactivating ? (
                  <>
                    Reactivating <Spinner size="sm" className="ml-2" />
                  </>
                ) : (
                  "Reactivate Subscription"
                )}
              </Button>
            )}
          </div>
        </>
      ) : (
        <p>You do not have an active subscription.</p>
      )}
    </div>
  );
}
