import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patient_id');
    const doctorId = searchParams.get('doctor_id');
    const visitType = searchParams.get('visit_type');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('visits')
      .select(`
        *,
        patient:patients (
          id,
          patient_number,
          first_name,
          last_name,
          date_of_birth,
          gender,
          blood_group,
          contact_number
        ),
        doctor:users!visits_doctor_id_fkey (
          id,
          first_name,
          last_name,
          email
        ),
        prescription:prescriptions (
          id,
          prescription_number,
          status,
          notes
        )
      `, { count: 'exact' })
      .is('deleted_at', null)
      .order('visit_date', { ascending: false });

    // Apply filters
    if (patientId) query = query.eq('patient_id', patientId);
    if (doctorId) query = query.eq('doctor_id', doctorId);
    if (visitType) query = query.eq('visit_type', visitType);
    if (startDate) query = query.gte('visit_date', startDate);
    if (endDate) query = query.lte('visit_date', endDate);

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: visits, error, count } = await query;

    if (error) {
      console.error('Error fetching visits:', error);
      return NextResponse.json(
        { error: 'Failed to fetch visits' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      visits: visits || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Visit fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      patient_id,
      doctor_id,
      hospital_id,
      visit_type = 'consultation',
      chief_complaint,
      diagnosis,
      vital_signs,
      notes,
      prescription_data, // Optional: { notes, items: [{ medication_name, dosage, frequency, duration, quantity }] }
    } = body;

    // Validate required fields
    if (!patient_id || !doctor_id || !hospital_id) {
      return NextResponse.json(
        { error: 'Missing required fields: patient_id, doctor_id, hospital_id' },
        { status: 400 }
      );
    }

    // Verify patient exists
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('id', patient_id)
      .eq('hospital_id', hospital_id)
      .single();

    if (patientError || !patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Create visit
    const { data: visit, error: visitError } = await supabase
      .from('visits')
      .insert({
        patient_id,
        doctor_id,
        hospital_id,
        visit_type,
        visit_date: new Date().toISOString(),
        chief_complaint,
        diagnosis,
        vital_signs: vital_signs || null,
        notes,
      })
      .select(`
        *,
        patient:patients (
          id,
          patient_number,
          first_name,
          last_name,
          date_of_birth,
          gender,
          blood_group
        ),
        doctor:users!visits_doctor_id_fkey (
          id,
          first_name,
          last_name,
          email
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

    // Create prescription if provided
    let prescription = null;
    if (prescription_data && prescription_data.items && prescription_data.items.length > 0) {
      const { data: newPrescription, error: prescriptionError } = await supabase
        .from('prescriptions')
        .insert({
          visit_id: visit.id,
          patient_id,
          doctor_id,
          hospital_id,
          status: 'pending',
          notes: prescription_data.notes || null,
        })
        .select()
        .single();

      if (prescriptionError) {
        console.error('Error creating prescription:', prescriptionError);
      } else {
        prescription = newPrescription;

        // Create prescription items
        const prescriptionItems = prescription_data.items.map((item: any) => ({
          prescription_id: newPrescription.id,
          medication_name: item.medication_name,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          quantity: item.quantity,
          instructions: item.instructions || null,
        }));

        const { error: itemsError } = await supabase
          .from('prescription_items')
          .insert(prescriptionItems);

        if (itemsError) {
          console.error('Error creating prescription items:', itemsError);
        }
      }
    }

    return NextResponse.json({
      visit: {
        ...visit,
        prescription,
      },
      message: 'Visit recorded successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Visit creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
