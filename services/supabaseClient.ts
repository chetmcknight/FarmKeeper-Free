import { createClient } from '@supabase/supabase-js';

// NOTE: To use Supabase, you must:
// 1. Create a project at https://supabase.com
// 2. Add your URL and Anon Key to environment variables (process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
// 3. Run the SQL schema provided in 'supabase/schema.sql' in your Supabase SQL Editor.
// 4. The app will automatically switch to Supabase if the environment variables are detected.

// Safely access environment variables (supports Vite and other environments)
const getEnv = (key: string) => {
  // 1. Try Vite's import.meta.env (VITE_ prefix usually required for client exposure)
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    const viteKey = key.startsWith('VITE_') ? key : `VITE_${key}`;
    if ((import.meta as any).env[viteKey]) return (import.meta as any).env[viteKey];
    if ((import.meta as any).env[key]) return (import.meta as any).env[key];
  }
  
  // 2. Try process.env (Node.js / Polyfilled environments)
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
  } catch (e) {
    // Ignore ReferenceError if process is not defined
  }
  
  return undefined;
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_KEY');

// Only initialize if we have a URL to prevent "supabaseUrl is required" error during import
// if the environment variables are not set.
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;