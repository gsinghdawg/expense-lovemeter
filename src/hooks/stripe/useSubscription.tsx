
// Mock implementation for useSubscription
export function useSubscription(userId?: string) {
  return {
    subscription: null,
    subscriptionDetails: null,
    isLoading: false,
    error: null,
    cancelSubscription: () => Promise.resolve(),
    reactivateSubscription: () => Promise.resolve(),
    fetchSubscriptionDetails: () => Promise.resolve()
  };
}
