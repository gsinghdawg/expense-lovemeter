import Stripe from 'npm:stripe@12.7.0';
import { corsHeaders } from '../_shared/cors.ts';

// Create a Stripe client with the secret key
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

// Update the webhook secret with the provided value
const webhookSecret = 'whsec_7i5MDKN6OMEj6GnfdUwKvD2b1ZwrPCN8';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }
    
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      return new Response('Stripe signature missing', { status: 400, headers: corsHeaders });
    }
    
    console.log('Webhook received, verifying signature with secret starting with:', webhookSecret.substring(0, 4));
    
    // Verify the webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err}`);
      return new Response(`Webhook Error: ${err.message}`, { status: 400, headers: corsHeaders });
    }
    
    console.log(`Event received: ${event.type}`);
    
    // Handle specific events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleSuccessfulPayment(session);
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleSuccessfulSubscription(invoice);
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancellation(subscription);
        break;
      }
    }
    
    return new Response(JSON.stringify({ received: true }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error(`Error processing webhook: ${error}`);
    return new Response(`Webhook error: ${error.message}`, { 
      status: 500,
      headers: corsHeaders
    });
  }
});

// Handle successful one-time payment
async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  console.log('Processing successful payment:', session.id);
  
  if (!session.customer || !session.client_reference_id) {
    console.error('Missing customer ID or user reference in session');
    return;
  }
  
  try {
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseKey);

    // Get payment details
    const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string);
    
    // Record payment in payment_history table
    await supabaseAdmin
      .from('payment_history')
      .insert({
        user_id: session.client_reference_id,
        stripe_payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        payment_method: paymentIntent.payment_method_types[0],
        description: session.metadata?.description || 'One-time payment'
      });
      
    // If this is a subscription payment, also update the user's subscription
    if (session.mode === 'subscription' && session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      
      // Create or update the subscription record in Supabase
      await supabaseAdmin
        .from('subscriptions')
        .upsert({
          user_id: session.client_reference_id,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscription.id,
          plan_id: subscription.items.data[0]?.price.id || 'unknown',
          status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString()
        });
    }
      
    console.log('Payment recorded successfully');
  } catch (error) {
    console.error('Error recording payment:', error);
  }
}

// Handle successful subscription payment
async function handleSuccessfulSubscription(invoice: Stripe.Invoice) {
  console.log('Processing subscription payment:', invoice.id);
  
  if (!invoice.customer || !invoice.subscription) {
    console.error('Missing customer ID or subscription ID');
    return;
  }

  try {
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseKey);
    
    // Get the subscription
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    
    // Get the customer to find the user_id
    const { data: customerData } = await supabaseAdmin
      .from('stripe_customers')
      .select('user_id')
      .eq('stripe_customer_id', invoice.customer as string)
      .single();
      
    if (!customerData) {
      console.error('Customer not found in database:', invoice.customer);
      return;
    }
    
    // Record payment in payment_history
    await supabaseAdmin
      .from('payment_history')
      .insert({
        user_id: customerData.user_id,
        stripe_payment_intent_id: invoice.payment_intent as string,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'succeeded',
        payment_method: invoice.collection_method,
        description: `Subscription payment for ${subscription.items.data[0]?.price.product}`
      });
    
    // Update subscription record
    await supabaseAdmin
      .from('subscriptions')
      .upsert({
        user_id: customerData.user_id,
        stripe_customer_id: invoice.customer as string,
        stripe_subscription_id: subscription.id,
        plan_id: subscription.items.data[0]?.price.id || 'unknown',
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString()
      });
    
    console.log('Subscription payment recorded successfully');
  } catch (error) {
    console.error('Error recording subscription payment:', error);
  }
}

// Handle subscription updates
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  console.log('Processing subscription update:', subscription.id);
  
  try {
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseKey);
    
    // Get the customer to find the user_id
    const { data: customerData } = await supabaseAdmin
      .from('stripe_customers')
      .select('user_id')
      .eq('stripe_customer_id', subscription.customer as string)
      .single();
      
    if (!customerData) {
      console.error('Customer not found in database:', subscription.customer);
      return;
    }
    
    // Update the subscription in the database
    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);
    
    console.log('Subscription updated successfully');
  } catch (error) {
    console.error('Error updating subscription:', error);
  }
}

// Handle subscription cancellations
async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  console.log('Processing subscription cancellation:', subscription.id);
  
  try {
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseKey);
    
    // Update the subscription status in the database
    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);
    
    console.log('Subscription cancellation recorded successfully');
  } catch (error) {
    console.error('Error recording subscription cancellation:', error);
  }
}

// Helper function to create a Supabase client
function createSupabaseClient(supabaseUrl: string, supabaseKey: string) {
  return {
    from: (table: string) => ({
      insert: (data: any) => fetch(`${supabaseUrl}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify(data)
      }),
      upsert: (data: any) => fetch(`${supabaseUrl}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(data)
      }),
      update: (data: any) => ({
        eq: (column: string, value: string) => fetch(`${supabaseUrl}/rest/v1/${table}?${column}=eq.${value}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify(data)
        })
      }),
      select: (columns: string) => ({
        eq: (column: string, value: string) => ({
          single: () => fetch(`${supabaseUrl}/rest/v1/${table}?select=${columns}&${column}=eq.${value}&limit=1`, {
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            }
          }).then(res => res.json().then(data => ({ data: data[0] || null })))
        })
      })
    })
  };
}
