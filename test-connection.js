const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAutoDB() {
  console.log('Testing Replit -> Supabase connection...');
  
  // Test 1: Service key se data read kar sakta hai ya nahi
  const { data, error } = await supabase.from('admin_users').select('count');
  
  if (error && error.code === '42P01') {
    console.log('✅ SERVICE_KEY CONNECT HO GAYI');
    console.log('➡️ Table "admin_users" nahi mili. Matlab abhi tak setup-db nahi chalaya.');
    console.log('✅ REPLIT AUTO KAAM KAREGA - /api/setup-db hit karte hi tables ban jayengi');
  } else if (error) {
    console.log('❌ SERVICE_KEY KAAM NAHI KAR RAHI:', error.message);
  } else {
    console.log('✅ SERVICE_KEY CONNECT HO GAYI');
    console.log('✅ admin_users table bhi mil gayi');
    console.log('✅ REPLIT AUTO KAAM KAREGA - Sab ready hai');
  }
}

testAutoDB();
