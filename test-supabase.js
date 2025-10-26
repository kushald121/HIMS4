const { createClient } = require('@supabase/supabase-js');

// Use the same credentials as in your .env.local
const supabaseUrl = 'https://iculvdxvemhzoyankqay.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljdWx2ZHh2ZW1oem95YW5rcWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMzM1MTEsImV4cCI6MjA3MDgwOTUxMX0.Ug-YY1-uCkOC3kw1i-3WUy5nnYc0tkPvBNB274533qM';

console.log('Testing Supabase connection...');
console.log('Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test the connection by trying to fetch data from a table
async function testConnection() {
  try {
    console.log('Attempting to connect to Supabase...');
    
    // Try to get the users table schema (without querying actual data)
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
      
    if (error) {
      console.log('Supabase connection error:', error);
      return;
    }
    
    console.log('Supabase connection successful!');
    console.log('Sample data:', data);
  } catch (error) {
    console.log('Connection test failed:', error);
  }
}

testConnection();