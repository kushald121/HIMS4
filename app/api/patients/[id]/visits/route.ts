import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/app/utils/response';
import { requireRole } from '@/app/middleware/auth';

export const dynamic = 'force-dynamic';

// GET /api/patients/[id]/visits - Get patient visit history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireRole(request, ['admin', 'doctor', 'receptionist', 'pharmacist']);
    const patientId = params.id;

    // Verify patient belongs to hospital
    const { data: patient } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('id', patientId)
      .eq('hospital_id', auth.hospitalId!)
      .is('deleted_at', null)
      .single();

    if (!patient) {
      return errorResponse('Patient not found', 404);
    }

    const { data: visits, error } = await supabaseAdmin
      .from('visits')
      .select(`
        *,
        patients(patient_number, date_of_birth, gender),
        hospital_users!visits_doctor_id_fkey(
          id,
          role,
          users(first_name, last_name)
        ),
        prescriptions(*)
      `)
      .eq('patient_id', patientId)
      .eq('hospital_id', auth.hospitalId!)
      .order('visit_date', { ascending: false });

    if (error) {
      console.error('Error fetching visits:', error);
      return errorResponse('Failed to fetch visits', 500);
    }

    return successResponse({ visits: visits || [] });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Forbidden') {
      return forbiddenResponse();
    }
    console.error('Error in GET /api/patients/[id]/visits:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
