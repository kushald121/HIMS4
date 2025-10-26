import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { requireRole } from '@/app/middleware/auth';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/app/utils/response';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['admin', 'doctor', 'pharmacist']);

    const { searchParams } = new URL(request.url);
    const visitId = searchParams.get('visit_id');
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('prescriptions')
      .select(`
        *,
        visits(visit_number, patients(patient_number, users(first_name, last_name))),
        hospital_users(users(first_name, last_name))
      `)
      .eq('visits.hospital_id', auth.hospitalId!)
      .order('created_at', { ascending: false });

    if (visitId) {
      query = query.eq('visit_id', parseInt(visitId));
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: prescriptions, error } = await query;

    if (error) {
      return errorResponse(error.message);
    }

    return successResponse({ prescriptions });
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
    const auth = await requireRole(request, ['doctor']);
    const body = await request.json();

    const { data: prescription, error } = await supabaseAdmin
      .from('prescriptions')
      .insert({
        visit_id: body.visit_id,
        prescribed_by: auth.hospitalUser!.id,
        medication_name: body.medication_name,
        generic_name: body.generic_name,
        dosage: body.dosage,
        frequency: body.frequency,
        duration: body.duration,
        quantity_prescribed: body.quantity_prescribed,
        instructions: body.instructions,
        status: 'pending',
        created_by: auth.hospitalUser!.id
      })
      .select()
      .single();

    if (error) {
      return errorResponse(error.message);
    }

    return successResponse({ prescription }, 201);
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
