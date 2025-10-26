import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/appointments/available-slots - Get available time slots for a doctor
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctor_id');
    const date = searchParams.get('date');

    if (!doctorId || !date) {
      return NextResponse.json(
        { error: 'Doctor ID and date are required' },
        { status: 400 }
      );
    }

    // Define working hours (9 AM to 5 PM) with 30-minute slots
    const workingHours = {
      start: 9, // 9 AM
      end: 17, // 5 PM
      slotDuration: 30, // minutes
    };

    // Generate all possible time slots
    const allSlots: string[] = [];
    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      for (let minute = 0; minute < 60; minute += workingHours.slotDuration) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        allSlots.push(timeString);
      }
    }

    // Get booked appointments for this doctor on this date
    const { data: bookedAppointments, error } = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', date)
      .in('status', ['scheduled', 'confirmed'])
      .is('deleted_at', null);

    if (error) {
      console.error('Error fetching booked appointments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch available slots' },
        { status: 500 }
      );
    }

    // Get booked time slots
    const bookedSlots = bookedAppointments?.map((apt) => apt.appointment_time) || [];

    // Filter out booked slots and past slots for today
    const currentDate = new Date();
    const selectedDate = new Date(date);
    const isToday = selectedDate.toDateString() === currentDate.toDateString();

    const availableSlots = allSlots.filter((slot) => {
      // Filter out booked slots
      if (bookedSlots.includes(slot)) {
        return false;
      }

      // Filter out past slots if it's today
      if (isToday) {
        const [hours, minutes] = slot.split(':').map(Number);
        const slotTime = new Date();
        slotTime.setHours(hours, minutes, 0, 0);
        return slotTime > currentDate;
      }

      return true;
    });

    // Format slots with labels
    const formattedSlots = availableSlots.map((slot) => {
      const [hours, minutes] = slot.split(':').map(Number);
      const hour12 = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      const period = hours >= 12 ? 'PM' : 'AM';
      const label = `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;

      return {
        value: slot,
        label: label,
        available: true,
      };
    });

    return NextResponse.json({
      date,
      doctor_id: doctorId,
      slots: formattedSlots,
      total_slots: allSlots.length,
      available_slots: formattedSlots.length,
      booked_slots: bookedSlots.length,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
