
// Mock implementation for useCustomerPortal
export function useCustomerPortal() {
  return {
    customerPortalUrl: null,
    isLoading: false,
    error: null,
    getCustomerPortal: () => Promise.resolve(),
    fetchCustomerPortalUrl: () => Promise.resolve()
  };
}
