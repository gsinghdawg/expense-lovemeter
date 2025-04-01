
// Mock implementation for useSubscription
export function useSubscription() {
  return {
    subscription: null,
    isLoading: false,
    error: null,
    cancelSubscription: () => Promise.resolve(),
  };
}
