import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/appointments/[id] - Get single appointment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patients:patient_id (
          id,
          patient_number,
          first_name,
          last_name,
          contact_number,
          email,
          date_of_birth,
          gender
        ),
        doctors:doctor_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      console.error('Error fetching appointment:', error);
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/appointments/[id] - Update appointment
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      appointment_date,
      appointment_time,
      status,
      reason,
      notes,
      cancellation_reason,
    } = body;

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (appointment_date) updateData.appointment_date = appointment_date;
    if (appointment_time) updateData.appointment_time = appointment_time;
    if (status) updateData.status = status;
    if (reason !== undefined) updateData.reason = reason;
    if (notes !== undefined) updateData.notes = notes;
    if (cancellation_reason !== undefined) updateData.cancellation_reason = cancellation_reason;

    // If rescheduling, check availability
    if (appointment_date && appointment_time) {
      const { data: currentAppointment } = await supabase
        .from('appointments')
        .select('doctor_id')
        .eq('id', id)
        .single();

      if (currentAppointment) {
        const { data: existingAppointments } = await supabase
          .from('appointments')
          .select('id')
          .eq('doctor_id', currentAppointment.doctor_id)
          .eq('appointment_date', appointment_date)
          .eq('appointment_time', appointment_time)
          .neq('id', id)
          .in('status', ['scheduled', 'confirmed'])
          .is('deleted_at', null);

        if (existingAppointments && existingAppointments.length > 0) {
          return NextResponse.json(
            { error: 'Doctor is not available at this time' },
            { status: 409 }
          );
        }
      }
    }

    const { data: appointment, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
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

    if (error) {
      console.error('Error updating appointment:', error);
      return NextResponse.json(
        { error: 'Failed to update appointment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/appointments/[id] - Soft delete appointment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { error } = await supabase
      .from('appointments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error deleting appointment:', error);
      return NextResponse.json(
        { error: 'Failed to delete appointment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
