
import Stripe from 'npm:stripe@12.7.0';

// Initialize Stripe with better error handling
export const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
  timeout: 40000, // Increase timeout to 40 seconds for slower connections
});

// Export a function to check if Stripe is properly configured
export function isStripeConfigured(): boolean {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  return !!stripeKey && stripeKey.startsWith('sk_');
}

// Helper function to log Stripe mode (test or live)
export function logStripeMode(): void {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') || '';
  console.log(`Using Stripe in mode: ${stripeKey.startsWith('sk_test') ? 'TEST' : 'LIVE'}`);
}

// Verify that the Stripe connection is working
export async function verifyStripeConnection(): Promise<{ isValid: boolean; message: string }> {
  try {
    if (!isStripeConfigured()) {
      return { 
        isValid: false, 
        message: 'Stripe API key is missing or invalid' 
      };
    }
    
    // Make a simple API call to verify the connection
    await stripe.balance.retrieve();
    
    return { 
      isValid: true, 
      message: 'Stripe connection verified successfully' 
    };
  } catch (error) {
    return { 
      isValid: false, 
      message: `Failed to connect to Stripe: ${error.message}` 
    };
  }
}
