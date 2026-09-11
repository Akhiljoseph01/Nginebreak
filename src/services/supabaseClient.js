import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://sqkftwstcfijaecbupbf.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxa2Z0d3N0Y2ZpamFlY2J1cGJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4ODAwOTgsImV4cCI6MjEwNDQ1NjA5OH0.WhxlodWJzFTgjx_vw2rPoQRywZVEhSwcg-AMTJwZ-i4';

// Check if credentials exist and are valid
export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    supabaseAnonKey !== 'your-anon-key'
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

