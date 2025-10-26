import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { requireRole } from '@/app/middleware/auth';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/app/utils/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['admin', 'doctor', 'receptionist', 'pharmacist']);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const gender = searchParams.get('gender');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('patients')
      .select(`
        *,
        users(first_name, last_name, email, phone),
        hospital_users!patients_created_by_fkey(
          id,
          users(first_name, last_name)
        )
      `, { count: 'exact' })
      .eq('hospital_id', auth.hospitalId!)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`patient_number.ilike.%${search}%,contact_number.ilike.%${search}%,emergency_contact_name.ilike.%${search}%`);
    }

    if (gender) {
      query = query.eq('gender', gender);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: patients, error, count } = await query;

    if (error) {
      return errorResponse(error.message);
    }

    // Calculate age for each patient
    const patientsWithAge = patients?.map(patient => {
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
      return { ...patient, age };
    });

    return successResponse({
      patients: patientsWithAge || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
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

    // Validate required fields
    if (!body.contact_number || !body.date_of_birth || !body.gender) {
      return errorResponse('Missing required fields: contact_number, date_of_birth, gender', 400);
    }

    // Generate sequential patient number
    const { data: lastPatient } = await supabaseAdmin
      .from('patients')
      .select('patient_number')
      .eq('hospital_id', auth.hospitalId!)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let nextNumber = 1;
    if (lastPatient?.patient_number) {
      const match = lastPatient.patient_number.match(/P(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    const patientNumber = `P${nextNumber.toString().padStart(4, '0')}`;

    const { data: patient, error } = await supabaseAdmin
      .from('patients')
      .insert({
        hospital_id: auth.hospitalId!,
        patient_number: patientNumber,
        user_id: body.user_id || null,
        date_of_birth: body.date_of_birth,
        gender: body.gender,
        contact_number: body.contact_number,
        emergency_contact_name: body.emergency_contact_name || null,
        emergency_contact_number: body.emergency_contact_number || null,
        address: body.address || null,
        blood_group: body.blood_group || null,
        allergies: body.allergies || null,
        medical_history: body.medical_history || null,
        created_by: auth.hospitalUser!.id
      })
      .select(`
        *,
        users(first_name, last_name, email, phone)
      `)
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
