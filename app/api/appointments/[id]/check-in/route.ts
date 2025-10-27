import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/appointments/[id]/check-in - Check in patient and create visit
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get appointment details
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Check if appointment is in valid status
    if (!['scheduled', 'confirmed'].includes(appointment.status)) {
      return NextResponse.json(
        { error: `Cannot check in appointment with status: ${appointment.status}` },
        { status: 400 }
      );
    }

    // Check if visit already exists for this appointment
    const { data: existingVisit } = await supabase
      .from('visits')
      .select('id, visit_number')
      .eq('appointment_id', id)
      .is('deleted_at', null)
      .single();

    if (existingVisit) {
      return NextResponse.json(
        { 
          error: 'Visit already created for this appointment',
          visit_number: existingVisit.visit_number 
        },
        { status: 409 }
      );
    }

    // Generate visit number
    const { data: lastVisit } = await supabase
      .from('visits')
      .select('visit_number')
      .eq('hospital_id', appointment.hospital_id)
      .order('id', { ascending: false })
      .limit(1)
      .single();

    let visitNumber = 'V0001';
    if (lastVisit?.visit_number) {
      const lastNumber = parseInt(lastVisit.visit_number.substring(1));
      visitNumber = `V${(lastNumber + 1).toString().padStart(4, '0')}`;
    }

    // Create visit
    const { data: visit, error: visitError } = await supabase
      .from('visits')
      .insert({
        hospital_id: appointment.hospital_id,
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        appointment_id: appointment.id,
        visit_number: visitNumber,
        visit_date: new Date().toISOString().split('T')[0],
        visit_type: 'consultation',
        chief_complaint: appointment.reason || 'Scheduled appointment',
        notes: `Check-in from appointment on ${appointment.appointment_date} at ${appointment.appointment_time}`,
      })
      .select(`
        *,
        patients:patient_id (
          id,
          patient_number,
          first_name,
          last_name
        ),
        doctors:doctor_id (
          id,
          users (
            first_name,
            last_name
          )
        )
      `)
      .single();

    if (visitError) {
      console.error('Error creating visit:', visitError);
      return NextResponse.json(
        { error: 'Failed to create visit' },
        { status: 500 }
      );
    }

    // Update appointment status to completed
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating appointment:', updateError);
      // Don't fail the request, visit was created successfully
    }

    return NextResponse.json({
      message: 'Patient checked in successfully',
      visit,
      appointment_id: id,
    }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
