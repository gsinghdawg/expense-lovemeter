
// Import Stripe from npm using URL imports for Deno
import Stripe from 'npm:stripe@12.7.0';
// Import Supabase JS client using URL imports for Deno
import { createClient } from 'npm:@supabase/supabase-js@2.31.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get the stripe secret key from environment variables - now using LIVE mode
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';
console.log('Using Stripe in mode:', stripeSecretKey.startsWith('sk_test') ? 'TEST' : 'LIVE');

// Create a Stripe client with the live secret key
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    // Get the JWT token from the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header present');
      return new Response('No authorization header', { status: 401, headers: corsHeaders });
    }

    // Extract the token from the Authorization header
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the JWT token and get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized', details: authError }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Parse the request body
    const requestData = await req.json();
    console.log('Request body:', requestData);
    
    const { priceId, mode, successUrl, cancelUrl } = requestData;
    
    if (!priceId || !mode || !successUrl || !cancelUrl) {
      console.error('Missing required parameters', { priceId, mode, successUrl, cancelUrl });
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters',
        receivedParams: { priceId, mode, successUrl, cancelUrl }
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user already has a Stripe customer ID
    const { data: customerData, error: customerError } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (customerError) {
      console.error('Error fetching customer data:', customerError);
    }
    
    let customerId;
    
    if (customerData?.stripe_customer_id) {
      console.log('Found existing customer:', customerData.stripe_customer_id);
      customerId = customerData.stripe_customer_id;
    } else {
      // Create a new customer in Stripe
      console.log('Creating new customer for user:', user.id);
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id
        }
      });
      
      customerId = customer.id;
      console.log('Created new customer:', customerId);
      
      // Store the customer ID in the database
      const { error: insertError } = await supabase
        .from('stripe_customers')
        .insert({
          user_id: user.id,
          stripe_customer_id: customerId
        });
        
      if (insertError) {
        console.error('Error storing customer ID:', insertError);
        // Continue anyway since we have the customer ID from Stripe
      }
    }

    // Create a checkout session
    console.log('Creating checkout session with:', {
      customer: customerId,
      client_reference_id: user.id,
      mode,
      priceId
    });
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: user.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode as Stripe.Checkout.SessionCreateParams.Mode,
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    console.log('Checkout session created:', session.id, 'Mode:', session.mode);

    // Return the session ID
    return new Response(JSON.stringify({ sessionId: session.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(JSON.stringify({ 
      error: 'Error creating checkout session', 
      message: error.message,
      stack: error.stack
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
