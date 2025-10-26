import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { requireRole } from '@/app/middleware/auth';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/app/utils/response';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['admin', 'doctor', 'receptionist']);

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patient_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabaseAdmin
      .from('visits')
      .select(`
        *,
        patients(patient_number, users(first_name, last_name)),
        hospital_users(users(first_name, last_name))
      `)
      .eq('hospital_id', auth.hospitalId!)
      .range(offset, offset + limit - 1)
      .order('visit_date', { ascending: false });

    if (patientId) {
      query = query.eq('patient_id', parseInt(patientId));
    }

    if (auth.hospitalUser!.role === 'doctor') {
      query = query.eq('doctor_id', auth.hospitalUser!.id);
    }

    const { data: visits, error } = await query;

    if (error) {
      return errorResponse(error.message);
    }

    return successResponse({ visits });
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
    const auth = await requireRole(request, ['admin', 'doctor', 'receptionist']);
    const body = await request.json();

    const visitNumber = `V${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const { data: visit, error } = await supabaseAdmin
      .from('visits')
      .insert({
        hospital_id: auth.hospitalId!,
        patient_id: body.patient_id,
        doctor_id: body.doctor_id,
        visit_number: visitNumber,
        visit_type: body.visit_type || 'consultation',
        chief_complaint: body.chief_complaint,
        symptoms: body.symptoms,
        diagnosis: body.diagnosis,
        treatment_plan: body.treatment_plan,
        notes: body.notes,
        status: 'active',
        created_by: auth.hospitalUser!.id
      })
      .select()
      .single();

    if (error) {
      return errorResponse(error.message);
    }

    return successResponse({ visit }, 201);
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
