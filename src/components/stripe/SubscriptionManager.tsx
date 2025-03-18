
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useStripe, Subscription } from '@/hooks/use-stripe';
import { formatCurrency } from '@/lib/utils';

interface SubscriptionManagerProps {
  className?: string;
}

export const SubscriptionManager = ({ className }: SubscriptionManagerProps) => {
  const { subscription, isSubscriptionLoading, manageSubscription, redirectToCustomerPortal } = useStripe();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const formattedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const handleCustomerPortal = async () => {
    setIsLoading(true);
    await redirectToCustomerPortal(`${window.location.origin}/dashboard`);
    setIsLoading(false);
  };
  
  const handleCancelSubscription = async () => {
    setIsLoading(true);
    const success = await manageSubscription('cancel');
    if (success) {
      setDialogOpen(false);
    }
    setIsLoading(false);
  };
  
  const handleReactivateSubscription = async () => {
    setIsLoading(true);
    await manageSubscription('reactivate');
    setIsLoading(false);
  };

  if (isSubscriptionLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Loading subscription information...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>You don't have an active subscription.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isActive = subscription.status === 'active' || subscription.status === 'trialing';
  const isCancelled = subscription.status === 'canceled';
  const willCancel = isActive && subscription.cancel_at_period_end;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Your Subscription</CardTitle>
        <CardDescription>
          Manage your subscription plan and payment details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <p className="text-lg font-semibold">
              {willCancel
                ? 'Cancels at period end'
                : isCancelled
                ? 'Canceled'
                : isActive
                ? 'Active'
                : subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
            </p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-muted-foreground">Plan</p>
            <p className="text-lg font-semibold">
              {subscription.plan_id.charAt(0).toUpperCase() + subscription.plan_id.slice(1).replace('_', ' ')}
            </p>
          </div>
          
          {isActive && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {willCancel ? 'Access Until' : 'Renews On'}
              </p>
              <p className="text-lg font-semibold">
                {formattedDate(subscription.current_period_end)}
              </p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:space-x-2 sm:space-y-0">
        <Button
          variant="outline"
          onClick={handleCustomerPortal}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          Manage Payment Method
        </Button>

        {isActive && (
          <>
            {willCancel ? (
              <Button
                onClick={handleReactivateSubscription}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Resume Subscription
              </Button>
            ) : (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="w-full sm:w-auto"
                  >
                    Cancel Subscription
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancel Subscription</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to cancel your subscription? You'll continue to have access until{' '}
                      {formattedDate(subscription.current_period_end)}.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      disabled={isLoading}
                    >
                      Keep Subscription
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleCancelSubscription}
                      disabled={isLoading}
                    >
                      Cancel Subscription
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
};
