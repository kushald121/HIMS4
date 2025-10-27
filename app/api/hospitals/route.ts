import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { requireAuth } from '@/app/middleware/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/app/utils/response';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const { data: hospitalUsers } = await supabaseAdmin
      .from('hospital_users')
      .select('hospital_id, role, hospitals(*)')
      .eq('user_id', auth.user.id)
      .is('deleted_at', null);

    const hospitals = hospitalUsers?.map(hu => ({
      ...hu.hospitals,
      user_role: hu.role
    })) || [];

    return successResponse({ hospitals });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return errorResponse(error.message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const body = await request.json();

    const { name, code, address, contact_email, contact_phone, logo_url } = body;

    if (!name) {
      return errorResponse('Hospital name is required');
    }

    if (!code) {
      return errorResponse('Hospital code is required');
    }

    // Validate code format (alphanumeric only)
    if (!/^[A-Z0-9]+$/.test(code)) {
      return errorResponse('Hospital code must contain only letters and numbers');
    }

    // Check if code already exists
    const { data: existingHospital } = await supabaseAdmin
      .from('hospitals')
      .select('id')
      .eq('code', code)
      .single();

    if (existingHospital) {
      return errorResponse('Hospital code already exists. Please choose a different code.');
    }

    const { data: hospital, error } = await supabaseAdmin
      .from('hospitals')
      .insert({
        name,
        code: code.toUpperCase(),
        address,
        contact_email,
        contact_phone,
        logo_url
      })
      .select()
      .single();

    if (error) {
      return errorResponse(error.message);
    }

    const { error: hospitalUserError } = await supabaseAdmin
      .from('hospital_users')
      .insert({
        hospital_id: hospital.id,
        user_id: auth.user.id,
        role: 'admin'
      });

    if (hospitalUserError) {
      return errorResponse(hospitalUserError.message);
    }

    return successResponse({ hospital }, 201);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return errorResponse(error.message, 500);
  }
}
