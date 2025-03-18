
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a Stripe client with the secret key
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
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
      return new Response('No authorization header', { status: 401, headers: corsHeaders });
    }

    // Extract the token from the Authorization header
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the JWT token and get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    // Parse the request body
    const { action, subscriptionId } = await req.json();
    
    if (!action || !subscriptionId) {
      return new Response('Missing required parameters', { 
        status: 400,
        headers: corsHeaders
      });
    }

    // Get user's subscription
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', user.id)
      .eq('stripe_subscription_id', subscriptionId)
      .single();
    
    if (subscriptionError || !subscriptionData) {
      return new Response('Subscription not found or does not belong to user', { 
        status: 404,
        headers: corsHeaders
      });
    }

    let result;
    
    switch (action) {
      case 'cancel':
        // Cancel subscription at period end
        result = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true
        });
        break;
        
      case 'reactivate':
        // Reactivate a subscription set to cancel at period end
        result = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: false
        });
        break;
        
      case 'cancel_immediately':
        // Cancel subscription immediately
        result = await stripe.subscriptions.cancel(subscriptionId);
        break;
        
      default:
        return new Response('Invalid action', { 
          status: 400,
          headers: corsHeaders
        });
    }

    // Return the result
    return new Response(JSON.stringify({ success: true, subscription: result }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error managing subscription:', error);
    return new Response(`Error: ${error.message}`, { 
      status: 500,
      headers: corsHeaders
    });
  }
});
