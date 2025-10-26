const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Use the same credentials as in your .env.local
const supabaseUrl = 'https://iculvdxvemhzoyankqay.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljdWx2ZHh2ZW1oem95YW5rcWF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTIzMzUxMSwiZXhwIjoyMDcwODA5NTExfQ.zTAyEsJ7nFnLEKTobg7Akd62ArC0KIughxc2kx_zQ0o';

console.log('Creating test user...');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to hash password (same as in your crypto utility)
function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt + ':' + derivedKey.toString('hex'));
    });
  });
}

async function createTestUser() {
  try {
    const email = 'test@example.com';
    const password = 'password123';
    const firstName = 'Test';
    const lastName = 'User';
    
    console.log(`Creating user with email: ${email}`);
    
    // Hash the password
    const passwordHash = await hashPassword(password);
    console.log('Password hashed successfully');
    
    // Insert the user
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        email_verified: false
      })
      .select();
      
    if (error) {
      console.log('Error creating user:', error);
      return;
    }
    
    console.log('User created successfully:', data);
    console.log('\nNow you can test the login with:');
    console.log('- Email: test@example.com');
    console.log('- Password: password123');
  } catch (error) {
    console.log('Error:', error);
  }
}

createTestUser();