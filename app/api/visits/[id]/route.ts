import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

// GET /api/visits/[id] - Get a single visit
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: visit, error } = await supabase
      .from('visits')
      .select(`
        *,
        patients (
          id,
          patient_number,
          first_name,
          last_name,
          date_of_birth,
          gender,
          blood_group,
          contact_number,
          allergies,
          chronic_conditions,
          medical_history
        ),
        hospital_users!visits_doctor_id_fkey (
          id,
          users (
            first_name,
            last_name,
            email
          )
        ),
        prescriptions (
          id,
          prescription_number,
          status,
          notes,
          created_at,
          filled_at,
          prescription_items (
            id,
            medication_name,
            dosage,
            frequency,
            duration,
            quantity,
            instructions,
            quantity_fulfilled
          )
        )
      `)
      .eq('id', params.id)
      .single();

    if (error || !visit) {
      return NextResponse.json(
        { error: 'Visit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ visit });
  } catch (error) {
    console.error('Visit fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/visits/[id] - Update a visit
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      visit_type,
      chief_complaint,
      diagnosis,
      vital_signs,
      notes,
    } = body;

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (visit_type) updateData.visit_type = visit_type;
    if (chief_complaint) updateData.chief_complaint = chief_complaint;
    if (diagnosis) updateData.diagnosis = diagnosis;
    if (vital_signs) updateData.vital_signs = vital_signs;
    if (notes !== undefined) updateData.notes = notes;

    const { data: visit, error } = await supabase
      .from('visits')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        patients (
          id,
          patient_number,
          first_name,
          last_name
        ),
        hospital_users!visits_doctor_id_fkey (
          id,
          users (
            first_name,
            last_name
          )
        )
      `)
      .single();

    if (error || !visit) {
      return NextResponse.json(
        { error: 'Failed to update visit' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      visit,
      message: 'Visit updated successfully',
    });
  } catch (error) {
    console.error('Visit update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/visits/[id] - Soft delete a visit
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: visit, error } = await supabase
      .from('visits')
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error || !visit) {
      return NextResponse.json(
        { error: 'Failed to delete visit' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Visit deleted successfully',
    });
  } catch (error) {
    console.error('Visit deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
