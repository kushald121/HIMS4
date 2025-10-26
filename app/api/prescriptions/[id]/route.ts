import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

// GET /api/prescriptions/[id] - Get single prescription
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: prescription, error } = await supabase
      .from('prescriptions')
      .select(`
        *,
        patient:patients (
          id,
          patient_number,
          first_name,
          last_name,
          contact_number,
          allergies
        ),
        doctor:users!prescriptions_doctor_id_fkey (
          id,
          first_name,
          last_name,
          email
        ),
        visit:visits (
          id,
          visit_number,
          visit_date,
          diagnosis,
          chief_complaint
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
      `)
      .eq('id', params.id)
      .is('deleted_at', null)
      .single();

    if (error || !prescription) {
      return NextResponse.json(
        { error: 'Prescription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ prescription });
  } catch (error) {
    console.error('Prescription fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/prescriptions/[id] - Update prescription
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, notes, filled_by } = body;

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updateData.status = status;
      if (status === 'filled') {
        updateData.filled_at = new Date().toISOString();
        if (filled_by) updateData.filled_by = filled_by;
      }
    }
    if (notes !== undefined) updateData.notes = notes;

    const { data: prescription, error } = await supabase
      .from('prescriptions')
      .update(updateData)
      .eq('id', params.id)
      .is('deleted_at', null)
      .select(`
        *,
        items:prescription_items (
          id,
          medication_name,
          quantity,
          quantity_dispensed
        )
      `)
      .single();

    if (error || !prescription) {
      return NextResponse.json(
        { error: 'Failed to update prescription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      prescription,
      message: 'Prescription updated successfully',
    });
  } catch (error) {
    console.error('Prescription update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/prescriptions/[id] - Soft delete prescription
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: prescription, error } = await supabase
      .from('prescriptions')
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error || !prescription) {
      return NextResponse.json(
        { error: 'Failed to delete prescription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Prescription deleted successfully',
    });
  } catch (error) {
    console.error('Prescription deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
