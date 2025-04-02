
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/stripe/useSubscription";
import { useCustomerPortal } from "@/hooks/stripe/useCustomerPortal";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function SubscriptionManager() {
  const { subscription, isLoading, error } = useSubscription();
  const { redirectToCustomerPortal } = useCustomerPortal();

  const handlePortalRedirect = async () => {
    await redirectToCustomerPortal();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Management</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading subscription details...</p>
        ) : error ? (
          <p className="text-red-500">Error loading subscription: {error.message}</p>
        ) : subscription ? (
          <div className="space-y-2">
            <p>Current subscription: {subscription.plan}</p>
            <p>Status: {subscription.status}</p>
            <p>Next billing date: {subscription.nextBillingDate}</p>
          </div>
        ) : (
          <p>No active subscription found.</p>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handlePortalRedirect} disabled={isLoading}>
          Manage Subscription
        </Button>
      </CardFooter>
    </Card>
  );
}
