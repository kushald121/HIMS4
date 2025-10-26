import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patient_id');
    const doctorId = searchParams.get('doctor_id');
    const visitId = searchParams.get('visit_id');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('prescriptions')
      .select(`
        *,
        patient:patients (
          id,
          patient_number,
          first_name,
          last_name,
          contact_number
        ),
        doctor:users!prescriptions_doctor_id_fkey (
          id,
          first_name,
          last_name
        ),
        visit:visits (
          id,
          visit_number,
          visit_date,
          diagnosis
        ),
        items:prescription_items (
          id,
          medication_name,
          dosage,
          frequency,
          duration,
          quantity,
          instructions,
          quantity_dispensed
        )
      `, { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    // Apply filters
    if (patientId) query = query.eq('patient_id', patientId);
    if (doctorId) query = query.eq('doctor_id', doctorId);
    if (visitId) query = query.eq('visit_id', visitId);
    if (status) query = query.eq('status', status);

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: prescriptions, error, count } = await query;

    if (error) {
      console.error('Error fetching prescriptions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch prescriptions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      prescriptions: prescriptions || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Prescription fetch error:', error);
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
      visit_id,
      patient_id,
      doctor_id,
      hospital_id,
      notes,
      items, // Array of { medication_name, dosage, frequency, duration, quantity, instructions }
    } = body;

    // Validate required fields
    if (!patient_id || !doctor_id || !hospital_id) {
      return NextResponse.json(
        { error: 'Missing required fields: patient_id, doctor_id, hospital_id' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'At least one medication item is required' },
        { status: 400 }
      );
    }

    // Create prescription
    const { data: prescription, error: prescriptionError } = await supabase
      .from('prescriptions')
      .insert({
        visit_id,
        patient_id,
        doctor_id,
        hospital_id,
        status: 'pending',
        notes,
      })
      .select()
      .single();

    if (prescriptionError) {
      console.error('Error creating prescription:', prescriptionError);
      return NextResponse.json(
        { error: 'Failed to create prescription' },
        { status: 500 }
      );
    }

    // Create prescription items
    const prescriptionItems = items.map((item: any) => ({
      prescription_id: prescription.id,
      medication_name: item.medication_name,
      dosage: item.dosage,
      frequency: item.frequency,
      duration: item.duration,
      quantity: item.quantity,
      instructions: item.instructions || null,
    }));

    const { data: createdItems, error: itemsError } = await supabase
      .from('prescription_items')
      .insert(prescriptionItems)
      .select();

    if (itemsError) {
      console.error('Error creating prescription items:', itemsError);
      // Rollback prescription
      await supabase.from('prescriptions').delete().eq('id', prescription.id);
      return NextResponse.json(
        { error: 'Failed to create prescription items' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      prescription: {
        ...prescription,
        items: createdItems,
      },
      message: 'Prescription created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Prescription creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
