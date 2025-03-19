
import { createClient } from 'npm:@supabase/supabase-js@2.31.0';

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Get user by JWT token in the request
export async function getUser(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;
  
  // Extract the token from the Authorization header
  const token = authHeader.replace('Bearer ', '');
  
  // Verify the JWT token and get the user
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    console.error('Auth error:', error);
    return null;
  }
  
  return user;
}
