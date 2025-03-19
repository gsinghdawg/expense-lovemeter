
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { stripe } from '../_shared/stripe.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getUser } from '../_shared/supabase.ts';

console.log('Create checkout function loaded');

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: 'No authorization header found',
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const user = await getUser(req);
    if (!user) {
      return new Response(JSON.stringify({
        error: 'User not found or not authenticated',
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Authenticated user:', user.id);

    // Parse the request body
    const { priceId, mode, successUrl, cancelUrl } = await req.json();

    console.log(`Creating ${mode} checkout session for price: ${priceId}`);
    console.log(`Success URL: ${successUrl}, Cancel URL: ${cancelUrl}`);

    // Validate required parameters
    if (!priceId || !mode || !successUrl || !cancelUrl) {
      return new Response(JSON.stringify({
        error: 'Missing required parameters: priceId, mode, successUrl, cancelUrl',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get or create the customer
    let customerId;
    try {
      const customerList = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });

      if (customerList.data.length > 0) {
        customerId = customerList.data[0].id;
        console.log('Found existing customer:', customerId);
      } else {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            user_id: user.id,
          },
        });
        customerId = customer.id;
        console.log('Created new customer:', customerId);
      }
    } catch (error) {
      console.error('Error with customer creation/lookup:', error);
      return new Response(JSON.stringify({
        error: 'Failed to create or retrieve customer',
        details: error.message,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create line items array based on provided priceIds
    const lineItems = [{
      price: priceId,
      quantity: 1,
    }];

    // Create checkout session
    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        client_reference_id: user.id,
        line_items: lineItems,
        mode: mode,
        success_url: successUrl,
        cancel_url: cancelUrl,
        billing_address_collection: 'auto',
      });

      console.log('Checkout session created:', session.id, 'Mode:', session.mode);

      // Return the session ID
      return new Response(JSON.stringify({
        sessionId: session.id,
        url: session.url, // Include the direct URL as a fallback
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return new Response(JSON.stringify({
        error: 'Failed to create checkout session',
        details: error.message,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
