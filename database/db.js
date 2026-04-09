const bcrypt = require('bcryptjs');
const { supabase } = require('../utils/supabase');

async function initializeDatabase() {
  if (!supabase) {
    console.warn('⚠️ Supabase not configured. Please add SUPABASE_URL and SUPABASE_ANON_KEY to .env');
    return;
  }

  try {
    // Seed default admin if no admin exists
    const { data: adminUsers, error } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1);
      
    if (error) {
      console.warn('⚠️ Could not connect to Supabase users table (Did you run the schema.sql in Supabase?)');
      return;
    }

    if (!adminUsers || adminUsers.length === 0) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      const { error: insertError } = await supabase.from('users').insert({
        username: 'admin',
        password: hashedPassword,
        role: 'admin'
      });
      
      if (!insertError) {
        console.log('✦ Default admin created logic complete (username: admin, password: admin123)');
      }
    }
    console.log('✦ Database connected successfully');
  } catch (err) {
    console.error('Database initialization failed:', err);
  }
}

module.exports = { initializeDatabase };
