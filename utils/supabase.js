const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || '';
// Use SERVICE_ROLE_KEY if provided to bypass RLS for server-side operations
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

// Create a single supabase client for interacting with your database & storage
let supabase;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.warn('⚠️ Supabase credentials not found in .env file. Storage features will not work.');
}

module.exports = { supabase };
