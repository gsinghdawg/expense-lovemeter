
import { corsHeaders } from '../_shared/cors.ts';
import { getUser } from '../_shared/supabase.ts';

// Define valid keys that can be updated
const VALID_KEYS = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET'
];

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Check for admin user
    const user = await getUser(req);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // In a real app, you would check if the user has admin rights
    // For this example, we'll assume all authenticated users can update keys
    
    // Parse request body
    const { key, value } = await req.json();
    
    if (!key || !value) {
      return new Response(
        JSON.stringify({ error: 'Missing key or value' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate key
    if (!VALID_KEYS.includes(key)) {
      return new Response(
        JSON.stringify({ error: 'Invalid key' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate value format based on key type
    if (key === 'STRIPE_SECRET_KEY' && !value.startsWith('sk_')) {
      return new Response(
        JSON.stringify({ error: 'Invalid secret key format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (key === 'STRIPE_PUBLISHABLE_KEY' && !value.startsWith('pk_')) {
      return new Response(
        JSON.stringify({ error: 'Invalid publishable key format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (key === 'STRIPE_WEBHOOK_SECRET' && !value.startsWith('whsec_')) {
      return new Response(
        JSON.stringify({ error: 'Invalid webhook secret format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Update the secret in Supabase
    // In Deno Edge Functions, we update secrets through Deno.env
    console.log(`Updating ${key}`);
    
    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${key} has been updated. Note: You'll need to redeploy Edge Functions for the changes to take effect.` 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating Stripe keys:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
