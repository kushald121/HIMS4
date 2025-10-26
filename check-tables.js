const { createClient } = require('@supabase/supabase-js');

// Use the service role key to check tables
const supabaseUrl = 'https://iculvdxvemhzoyankqay.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljdWx2ZHh2ZW1oem95YW5rcWF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTIzMzUxMSwiZXhwIjoyMDcwODA5NTExfQ.zTAyEsJ7nFnLEKTobg7Akd62ArC0KIughxc2kx_zQ0o';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  try {
    console.log('Checking if required tables exist...');
    
    // Check users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
      
    if (usersError) {
      console.log('Users table error:', usersError);
    } else {
      console.log('Users table exists and accessible');
    }
    
    // Check user_sessions table
    const { data: sessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('id')
      .limit(1);
      
    if (sessionsError) {
      console.log('User sessions table error:', sessionsError);
    } else {
      console.log('User sessions table exists and accessible');
    }
    
    // Check hospital_users table
    const { data: hospitalUsers, error: hospitalUsersError } = await supabase
      .from('hospital_users')
      .select('id')
      .limit(1);
      
    if (hospitalUsersError) {
      console.log('Hospital users table error:', hospitalUsersError);
    } else {
      console.log('Hospital users table exists and accessible');
    }
    
  } catch (error) {
    console.log('Error checking tables:', error);
  }
}

checkTables();