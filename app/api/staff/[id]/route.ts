import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { successResponse, errorResponse } from '@/app/utils/response';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PUT /api/staff/[id] - Update staff member
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const staffId = parseInt(params.id);
    const body = await request.json();
    const {
      first_name,
      last_name,
      phone,
      role,
      employee_id,
      department,
      specialization,
      license_number,
      is_active
    } = body;

    // Get the hospital_user record to find user_id
    const { data: hospitalUser, error: fetchError } = await supabase
      .from('hospital_users')
      .select('user_id, hospital_id')
      .eq('id', staffId)
      .single();

    if (fetchError || !hospitalUser) {
      return errorResponse('Staff member not found', 404);
    }

    // Update user information if provided
    if (first_name || last_name || phone) {
      const userUpdates: any = {};
      if (first_name) userUpdates.first_name = first_name;
      if (last_name) userUpdates.last_name = last_name;
      if (phone !== undefined) userUpdates.phone = phone || null;

      const { error: userError } = await supabase
        .from('users')
        .update(userUpdates)
        .eq('id', hospitalUser.user_id);

      if (userError) {
        console.error('Error updating user:', userError);
        return errorResponse('Failed to update user information', 500);
      }
    }

    // Check if employee_id is unique (if changing)
    if (employee_id) {
      const { data: existingEmployee } = await supabase
        .from('hospital_users')
        .select('id')
        .eq('hospital_id', hospitalUser.hospital_id)
        .eq('employee_id', employee_id)
        .neq('id', staffId)
        .single();

      if (existingEmployee) {
        return errorResponse('Employee ID already exists in this hospital', 400);
      }
    }

    // Update hospital_user information
    const hospitalUserUpdates: any = {};
    if (role) hospitalUserUpdates.role = role;
    if (employee_id !== undefined) hospitalUserUpdates.employee_id = employee_id || null;
    if (department !== undefined) hospitalUserUpdates.department = department || null;
    if (specialization !== undefined) hospitalUserUpdates.specialization = specialization || null;
    if (license_number !== undefined) hospitalUserUpdates.license_number = license_number || null;
    if (is_active !== undefined) hospitalUserUpdates.is_active = is_active;

    const { error: hospitalUserError } = await supabase
      .from('hospital_users')
      .update(hospitalUserUpdates)
      .eq('id', staffId);

    if (hospitalUserError) {
      console.error('Error updating hospital user:', hospitalUserError);
      return errorResponse('Failed to update staff information', 500);
    }

    return successResponse({
      message: 'Staff member updated successfully'
    });
  } catch (error) {
    console.error('Update staff error:', error);
    return errorResponse('An error occurred while updating staff member', 500);
  }
}

// DELETE /api/staff/[id] - Remove staff member (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const staffId = parseInt(params.id);

    // Get the hospital_user record
    const { data: hospitalUser, error: fetchError } = await supabase
      .from('hospital_users')
      .select('id')
      .eq('id', staffId)
      .single();

    if (fetchError || !hospitalUser) {
      return errorResponse('Staff member not found', 404);
    }

    // Soft delete: Set is_active to false
    const { error: deleteError } = await supabase
      .from('hospital_users')
      .update({ is_active: false })
      .eq('id', staffId);

    if (deleteError) {
      console.error('Error deleting staff:', deleteError);
      return errorResponse('Failed to remove staff member', 500);
    }

    return successResponse({
      message: 'Staff member removed successfully'
    });
  } catch (error) {
    console.error('Delete staff error:', error);
    return errorResponse('An error occurred while removing staff member', 500);
  }
}
