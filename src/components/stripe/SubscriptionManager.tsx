
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomerPortal } from "@/hooks/stripe/useCustomerPortal";
import { useSubscription } from "@/hooks/stripe/useSubscription";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { LoadingButton } from "@/components/ui/loading-button";

export function SubscriptionManager() {
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const { user } = useAuth();
  
  const {
    subscription,
    subscriptionDetails,
    cancelSubscription,
    reactivateSubscription,
    fetchSubscriptionDetails,
    isLoading: isLoadingSubscription,
    error: subscriptionError
  } = useSubscription(user?.id);
  
  const {
    customerPortalUrl,
    getCustomerPortal,
    isLoading: isLoadingPortal,
    error: portalError
  } = useCustomerPortal();
  
  useEffect(() => {
    if (customerPortalUrl) {
      window.open(customerPortalUrl, "_blank");
    }
  }, [customerPortalUrl]);
  
  const handleCancelSubscription = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to manage your subscription",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsCancelling(true);
      await cancelSubscription();
      
      if (fetchSubscriptionDetails) {
        await fetchSubscriptionDetails();
      }
      
      toast({
        title: "Subscription cancelled",
        description: "Your subscription has been cancelled and will end at the current billing period",
      });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast({
        title: "Error cancelling subscription",
        description: "There was a problem cancelling your subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };
  
  const handleReactivateSubscription = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to manage your subscription",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsReactivating(true);
      await reactivateSubscription();
      
      toast({
        title: "Subscription reactivated",
        description: "Your subscription has been successfully reactivated",
      });
      
      // Refresh subscription data
      if (fetchSubscriptionDetails) {
        await fetchSubscriptionDetails();
      }
    } catch (error) {
      console.error("Error reactivating subscription:", error);
      toast({
        title: "Error reactivating subscription",
        description: "There was a problem reactivating your subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsReactivating(false);
    }
  };
  
  const handleOpenCustomerPortal = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to view billing details",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      await getCustomerPortal();
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast({
        title: "Error opening billing portal",
        description: "There was a problem accessing your billing information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoadingSubscription) {
    return (
      <div className="flex justify-center p-4">
        <Spinner size="md" />
      </div>
    );
  }
  
  if (subscriptionError) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive mb-2">Error loading subscription</p>
        <Button onClick={() => fetchSubscriptionDetails && fetchSubscriptionDetails()}>
          Retry
        </Button>
      </div>
    );
  }
  
  if (!subscription) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground mb-2">No active subscription found</p>
      </div>
    );
  }
  
  // Mock subscription status
  const isActive = true;
  const isCancelled = false;
  const currentPeriodEnd = new Date();
  currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
  
  return (
    <div className="space-y-4">
      <div className="rounded-md border p-4">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Subscription Status</h4>
            <div className={`px-2 py-0.5 rounded-full text-xs ${isActive && !isCancelled ? 'bg-green-100 text-green-800' : isCancelled ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
              {isActive && !isCancelled
                ? "Active"
                : isCancelled
                  ? "Cancelled"
                  : "Inactive"}
            </div>
          </div>
          
          {isCancelled && (
            <p className="text-sm text-muted-foreground">
              Your subscription will end on {currentPeriodEnd.toLocaleDateString()}
            </p>
          )}
        </div>
        
        <div className="mt-4 space-y-2">
          {!isCancelled && isActive && (
            <LoadingButton 
              variant="outline"
              onClick={handleCancelSubscription}
              isLoading={isCancelling}
              disabled={isCancelling}
              className="w-full"
            >
              Cancel Subscription
            </LoadingButton>
          )}
          
          {isCancelled && (
            <LoadingButton
              onClick={handleReactivateSubscription}
              isLoading={isReactivating}
              disabled={isReactivating}
              className="w-full"
            >
              Reactivate Subscription
            </LoadingButton>
          )}
          
          <Button
            variant="outline"
            onClick={handleOpenCustomerPortal}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? <Spinner size="sm" /> : "Manage Billing"}
          </Button>
        </div>
      </div>
    </div>
  );
}
