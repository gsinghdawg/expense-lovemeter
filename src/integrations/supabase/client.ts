
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://nnlzrywcqfrbvcaxmghp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ubHpyeXdjcWZyYnZjYXhtZ2hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyMTk1MzQsImV4cCI6MjA1Njc5NTUzNH0.24Ovbso3y1g-uIaBrFpTIuJNQXBSbAhtA5X0lDbE0GQ";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
