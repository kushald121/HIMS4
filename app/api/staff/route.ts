import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hashPassword } from '@/app/utils/crypto';
import { successResponse, errorResponse } from '@/app/utils/response';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/staff - Get all staff for a hospital
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hospitalId = searchParams.get('hospital_id');

    if (!hospitalId) {
      return errorResponse('Hospital ID is required', 400);
    }

    // Get all hospital users (staff) with their user details
    const { data: staff, error } = await supabase
      .from('hospital_users')
      .select(`
        *,
        users:user_id (
          id,
          email,
          first_name,
          last_name,
          phone,
          date_of_birth,
          gender
        )
      `)
      .eq('hospital_id', hospitalId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching staff:', error);
      return errorResponse('Failed to fetch staff members', 500);
    }

    return successResponse({ staff: staff || [] });
  } catch (error) {
    console.error('Staff fetch error:', error);
    return errorResponse('An error occurred while fetching staff', 500);
  }
}

// POST /api/staff - Add new staff member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      first_name,
      last_name,
      phone,
      role,
      employee_id,
      department,
      specialization,
      license_number,
      hospital_id
    } = body;

    // Validation
    if (!email || !password || !first_name || !last_name || !role || !hospital_id) {
      return errorResponse('Required fields: email, password, first_name, last_name, role, hospital_id', 400);
    }

    // Valid roles
    const validRoles = ['admin', 'doctor', 'pharmacist', 'receptionist'];
    if (!validRoles.includes(role)) {
      return errorResponse('Invalid role. Must be: admin, doctor, pharmacist, or receptionist', 400);
    }

    // Check if user with this email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return errorResponse('A user with this email already exists', 400);
    }

    // Check if employee_id is unique within hospital (if provided)
    if (employee_id) {
      const { data: existingEmployee } = await supabase
        .from('hospital_users')
        .select('id')
        .eq('hospital_id', hospital_id)
        .eq('employee_id', employee_id)
        .single();

      if (existingEmployee) {
        return errorResponse('Employee ID already exists in this hospital', 400);
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: hashedPassword,
        first_name,
        last_name,
        phone: phone || null
      })
      .select()
      .single();

    if (userError || !newUser) {
      console.error('Error creating user:', userError);
      return errorResponse('Failed to create user account', 500);
    }

    // Create hospital_user mapping
    const { data: hospitalUser, error: hospitalUserError } = await supabase
      .from('hospital_users')
      .insert({
        user_id: newUser.id,
        hospital_id: parseInt(hospital_id),
        role,
        employee_id: employee_id || null,
        department: department || null,
        specialization: specialization || null,
        license_number: license_number || null,
        is_active: true
      })
      .select()
      .single();

    if (hospitalUserError || !hospitalUser) {
      // Rollback: Delete the created user
      await supabase.from('users').delete().eq('id', newUser.id);
      console.error('Error creating hospital user:', hospitalUserError);
      return errorResponse('Failed to add staff member to hospital', 500);
    }

    return successResponse({
      message: 'Staff member added successfully',
      user: newUser,
      hospital_user: hospitalUser
    }, 201);
  } catch (error) {
    console.error('Add staff error:', error);
    return errorResponse('An error occurred while adding staff member', 500);
  }
}
