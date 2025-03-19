
import Stripe from 'npm:stripe@12.7.0';

// Initialize Stripe with better error handling
export const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
  timeout: 30000, // Increase timeout to 30 seconds
});

// Export a function to check if Stripe is properly configured
export function isStripeConfigured(): boolean {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  return !!stripeKey && stripeKey.startsWith('sk_');
}
