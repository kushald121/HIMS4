const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config();

// Use the same credentials as in your .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
    // First, create or get the hospital
    console.log('Creating test hospital...');
    
    const { data: existingHospital } = await supabase
      .from('hospitals')
      .select('*')
      .eq('code', 'TEST')
      .single();
    
    let hospital = existingHospital;
    
    if (!hospital) {
      const { data: newHospital, error: hospitalError } = await supabase
        .from('hospitals')
        .insert({
          name: 'Test Hospital',
          code: 'TEST',
          address: '123 Test Street, Test City',
          contact_email: 'contact@testhospital.com',
          contact_phone: '+1234567890'
        })
        .select()
        .single();
      
      if (hospitalError) {
        console.log('Error creating hospital:', hospitalError);
        return;
      }
      hospital = newHospital;
      console.log('Hospital created:', hospital.name);
    } else {
      console.log('Using existing hospital:', hospital.name);
    }

    // Create test users for different roles
    const testUsers = [
      { email: 'admin@hospital.com', password: 'Admin@123', firstName: 'Admin', lastName: 'User', role: 'admin' },
      { email: 'doctor@hospital.com', password: 'Doctor@123', firstName: 'Dr. Sarah', lastName: 'Smith', role: 'doctor' },
      { email: 'pharmacist@hospital.com', password: 'Pharmacist@123', firstName: 'John', lastName: 'Pharmacist', role: 'pharmacist' },
      { email: 'receptionist@hospital.com', password: 'Receptionist@123', firstName: 'Jane', lastName: 'Receptionist', role: 'receptionist' }
    ];

    for (const testUser of testUsers) {
      console.log(`\nCreating ${testUser.role} user: ${testUser.email}`);
      
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', testUser.email)
        .single();
      
      let user = existingUser;
      
      if (!user) {
        // Hash the password
        const passwordHash = await hashPassword(testUser.password);
        
        // Insert the user
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({
            email: testUser.email,
            password_hash: passwordHash,
            first_name: testUser.firstName,
            last_name: testUser.lastName,
            email_verified: true,
            is_active: true
          })
          .select()
          .single();
        
        if (userError) {
          console.log(`Error creating ${testUser.role} user:`, userError);
          continue;
        }
        user = newUser;
        console.log(`User created: ${user.email}`);
      } else {
        console.log(`User already exists: ${user.email}`);
      }

      // Create hospital_user mapping
      const { data: existingHospitalUser } = await supabase
        .from('hospital_users')
        .select('*')
        .eq('hospital_id', hospital.id)
        .eq('user_id', user.id)
        .single();
      
      if (!existingHospitalUser) {
        const { error: hospitalUserError } = await supabase
          .from('hospital_users')
          .insert({
            hospital_id: hospital.id,
            user_id: user.id,
            role: testUser.role,
            employee_id: `EMP-${testUser.role.toUpperCase()}-001`,
            department: testUser.role === 'doctor' ? 'General Medicine' : testUser.role,
            is_active: true
          });
        
        if (hospitalUserError) {
          console.log(`Error creating hospital_user mapping:`, hospitalUserError);
        } else {
          console.log(`Hospital user mapping created for ${testUser.role}`);
        }
      } else {
        console.log(`Hospital user mapping already exists for ${testUser.role}`);
      }
    }
    
    console.log('\n✅ Test users created successfully!');
    console.log('\nYou can now login with:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:');
    console.log('  Email: admin@hospital.com');
    console.log('  Password: Admin@123');
    console.log('\nDoctor:');
    console.log('  Email: doctor@hospital.com');
    console.log('  Password: Doctor@123');
    console.log('\nPharmacist:');
    console.log('  Email: pharmacist@hospital.com');
    console.log('  Password: Pharmacist@123');
    console.log('\nReceptionist:');
    console.log('  Email: receptionist@hospital.com');
    console.log('  Password: Receptionist@123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error) {
    console.log('Error:', error);
  }
}

createTestUser();