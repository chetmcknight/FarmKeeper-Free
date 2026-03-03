import { createClient } from '@supabase/supabase-js';

// NOTE: To use Supabase, you must:
// 1. Create a project at https://supabase.com
// 2. Add your URL and Anon Key to environment variables (process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
// 3. Run the SQL schema provided in 'supabase/schema.sql' in your Supabase SQL Editor.
// 4. The app will automatically switch to Supabase if the environment variables are detected.

// Safely access process.env
const getEnv = (key: string) => {
  try {
    return process.env[key];
  } catch (e) {
    return undefined;
  }
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_KEY');

// Only initialize if we have a URL to prevent "supabaseUrl is required" error during import
// if the environment variables are not set.
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;