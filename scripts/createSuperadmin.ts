import { createClient } from '@supabase/supabase-js';

// Load from env or paste your Supabase credentials here
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createSuperadmin(email: string, password: string) {
  // Create user with role: superadmin in user_metadata
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: 'superadmin',
      permissions: 'all',
      created_by_script: true
    }
  });
  if (error) {
    console.error('Error creating superadmin:', error.message);
    process.exit(1);
  }
  console.log('Superadmin created:', data.user.email);
}

// Usage: node scripts/createSuperadmin.ts
createSuperadmin('xcaucasus@gmail.com', 'Gelagela4!');
