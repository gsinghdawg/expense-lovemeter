
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
  if (!stripeKey) {
    console.error('STRIPE_SECRET_KEY is not set in environment variables');
    return false;
  }
  
  const isValid = stripeKey.startsWith('sk_test') || stripeKey.startsWith('sk_live');
  if (!isValid) {
    console.error('STRIPE_SECRET_KEY is invalid. It should start with sk_test or sk_live');
  }
  
  return isValid;
}

// Helper function to log Stripe mode (test or live)
export function logStripeMode(): void {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') || '';
  const stripePublishableKey = Deno.env.get('STRIPE_PUBLISHABLE_KEY') || '';
  
  if (!stripeKey) {
    console.error('STRIPE_SECRET_KEY is not set');
  } else {
    console.log(`Using Stripe in mode: ${stripeKey.startsWith('sk_test') ? 'TEST' : 'LIVE'}`);
    console.log(`Stripe key first 8 chars: ${stripeKey.substring(0, 8)}...`);
  }
  
  if (!stripePublishableKey) {
    console.error('STRIPE_PUBLISHABLE_KEY is not set');
  } else {
    console.log(`Stripe publishable key first 8 chars: ${stripePublishableKey.substring(0, 8)}...`);
  }
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
    console.error('Stripe connection error:', error);
    return { 
      isValid: false, 
      message: `Failed to connect to Stripe: ${error.message}` 
    };
  }
}
