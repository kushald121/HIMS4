import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/appointments - List appointments with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hospitalId = searchParams.get('hospital_id');
    const patientId = searchParams.get('patient_id');
    const doctorId = searchParams.get('doctor_id');
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!hospitalId) {
      return NextResponse.json(
        { error: 'Hospital ID is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('appointments')
      .select(`
        *,
        patients:patient_id (
          id,
          patient_number,
          first_name,
          last_name,
          contact_number,
          email
        ),
        doctors:doctor_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('hospital_id', hospitalId)
      .is('deleted_at', null)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    if (doctorId) {
      query = query.eq('doctor_id', doctorId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (date) {
      query = query.eq('appointment_date', date);
    }

    if (startDate && endDate) {
      query = query.gte('appointment_date', startDate).lte('appointment_date', endDate);
    }

    const { data: appointments, error } = await query;

    if (error) {
      console.error('Error fetching appointments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch appointments' },
        { status: 500 }
      );
    }

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/appointments - Create new appointment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      hospital_id,
      patient_id,
      doctor_id,
      appointment_date,
      appointment_time,
      reason,
      notes,
    } = body;

    // Validation
    if (!hospital_id || !patient_id || !doctor_id || !appointment_date || !appointment_time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if doctor is available at this time
    const { data: existingAppointments, error: checkError } = await supabase
      .from('appointments')
      .select('id')
      .eq('doctor_id', doctor_id)
      .eq('appointment_date', appointment_date)
      .eq('appointment_time', appointment_time)
      .in('status', ['scheduled', 'confirmed'])
      .is('deleted_at', null);

    if (checkError) {
      console.error('Error checking availability:', checkError);
      return NextResponse.json(
        { error: 'Failed to check doctor availability' },
        { status: 500 }
      );
    }

    if (existingAppointments && existingAppointments.length > 0) {
      return NextResponse.json(
        { error: 'Doctor is not available at this time. Please choose another slot.' },
        { status: 409 }
      );
    }

    // Create appointment
    const { data: appointment, error: insertError } = await supabase
      .from('appointments')
      .insert({
        hospital_id,
        patient_id,
        doctor_id,
        appointment_date,
        appointment_time,
        reason: reason || null,
        notes: notes || null,
        status: 'scheduled',
      })
      .select(`
        *,
        patients:patient_id (
          id,
          patient_number,
          first_name,
          last_name,
          contact_number
        ),
        doctors:doctor_id (
          id,
          first_name,
          last_name
        )
      `)
      .single();

    if (insertError) {
      console.error('Error creating appointment:', insertError);
      return NextResponse.json(
        { error: 'Failed to create appointment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
