import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { requireRole } from '@/app/middleware/auth';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/app/utils/response';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['admin', 'doctor', 'receptionist']);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabaseAdmin
      .from('patients')
      .select('*, users(first_name, last_name, email)')
      .eq('hospital_id', auth.hospitalId!)
      .is('deleted_at', null)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`patient_number.ilike.%${search}%,contact_number.ilike.%${search}%`);
    }

    const { data: patients, error } = await query;

    if (error) {
      return errorResponse(error.message);
    }

    return successResponse({ patients });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Forbidden') {
      return forbiddenResponse();
    }
    return errorResponse(error.message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['admin', 'receptionist']);
    const body = await request.json();

    const patientNumber = `P${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const { data: patient, error } = await supabaseAdmin
      .from('patients')
      .insert({
        hospital_id: auth.hospitalId!,
        patient_number: patientNumber,
        user_id: body.user_id || null,
        date_of_birth: body.date_of_birth,
        gender: body.gender,
        contact_number: body.contact_number,
        emergency_contact_name: body.emergency_contact_name,
        emergency_contact_number: body.emergency_contact_number,
        address: body.address,
        blood_group: body.blood_group,
        allergies: body.allergies,
        medical_history: body.medical_history,
        created_by: auth.hospitalUser!.id
      })
      .select()
      .single();

    if (error) {
      return errorResponse(error.message);
    }

    return successResponse({ patient }, 201);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Forbidden') {
      return forbiddenResponse();
    }
    return errorResponse(error.message, 500);
  }
}
