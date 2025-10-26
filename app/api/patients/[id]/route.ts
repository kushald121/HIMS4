import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { successResponse, errorResponse } from '@/app/utils/response';
import { requireAuth } from '@/app/middleware/auth';

export const dynamic = 'force-dynamic';

// GET /api/patients/[id] - Get single patient
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.hospitalUser) {
      return errorResponse('Unauthorized', 401);
    }

    const { hospitalUser } = authResult;
    const patientId = params.id;

    const { data: patient, error } = await supabaseAdmin
      .from('patients')
      .select(`
        *,
        users(first_name, last_name, email, phone),
        hospital_users!patients_created_by_fkey(
          id,
          users(first_name, last_name)
        )
      `)
      .eq('id', patientId)
      .eq('hospital_id', hospitalUser.hospital_id)
      .is('deleted_at', null)
      .single();

    if (error || !patient) {
      console.error('Error fetching patient:', error);
      return errorResponse('Patient not found', 404);
    }

    // Calculate age
    let age = null;
    if (patient.date_of_birth) {
      const dob = new Date(patient.date_of_birth);
      const today = new Date();
      age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
    }

    return successResponse({ patient: { ...patient, age } });
  } catch (error: any) {
    console.error('Error in GET /api/patients/[id]:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

// PUT /api/patients/[id] - Update patient
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.hospitalUser) {
      return errorResponse('Unauthorized', 401);
    }

    const { hospitalUser } = authResult;
    const patientId = params.id;
    const body = await request.json();

    // Check if patient exists and belongs to hospital
    const { data: existingPatient } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('id', patientId)
      .eq('hospital_id', hospitalUser.hospital_id)
      .is('deleted_at', null)
      .single();

    if (!existingPatient) {
      return errorResponse('Patient not found', 404);
    }

    // Prepare update data (only include fields that are provided)
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    const allowedFields = [
      'date_of_birth',
      'gender',
      'contact_number',
      'emergency_contact_name',
      'emergency_contact_number',
      'address',
      'blood_group',
      'allergies',
      'medical_history'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    const { data: patient, error } = await supabaseAdmin
      .from('patients')
      .update(updateData)
      .eq('id', patientId)
      .select(`
        *,
        users(first_name, last_name, email, phone)
      `)
      .single();

    if (error) {
      console.error('Error updating patient:', error);
      return errorResponse('Failed to update patient', 500);
    }

    return successResponse({ patient });
  } catch (error: any) {
    console.error('Error in PUT /api/patients/[id]:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

// DELETE /api/patients/[id] - Soft delete patient
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.hospitalUser) {
      return errorResponse('Unauthorized', 401);
    }

    const { hospitalUser } = authResult;
    const patientId = params.id;

    // Check permissions - only admin and receptionist can delete
    if (!['admin', 'receptionist'].includes(hospitalUser.role)) {
      return errorResponse('Insufficient permissions', 403);
    }

    // Check if patient exists
    const { data: existingPatient } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('id', patientId)
      .eq('hospital_id', hospitalUser.hospital_id)
      .is('deleted_at', null)
      .single();

    if (!existingPatient) {
      return errorResponse('Patient not found', 404);
    }

    // Soft delete
    const { error } = await supabaseAdmin
      .from('patients')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', patientId);

    if (error) {
      console.error('Error deleting patient:', error);
      return errorResponse('Failed to delete patient', 500);
    }

    return successResponse({ message: 'Patient deleted successfully' });
  } catch (error: any) {
    console.error('Error in DELETE /api/patients/[id]:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
