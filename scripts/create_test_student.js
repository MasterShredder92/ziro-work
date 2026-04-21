const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function createTestStudent() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Supabase URL or Service Role Key not set.');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const studentData = {
    first_name: 'Test',
    last_name: 'Student',
    email: 'test.student@example.com',
    instrument: 'Guitar',
    status: 'active',
    tenant_id: '00000000-0000-0000-0000-000000000000', // Default tenant ID
  };

  const { data, error } = await supabase.from('students').insert([studentData]).select();

  if (error) {
    console.error('Error creating test student:', error);
  } else {
    console.log('Test student created successfully:', data[0]);
    return data[0].id;
  }
}

createTestStudent();
