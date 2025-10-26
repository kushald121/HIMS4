import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

// POST /api/prescriptions/[id]/fulfill - Fulfill prescription and update inventory
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { filled_by, items } = body; // items: [{ item_id, quantity_dispensed }]

    if (!filled_by) {
      return NextResponse.json(
        { error: 'filled_by (pharmacist ID) is required' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items array is required' },
        { status: 400 }
      );
    }

    // Get prescription details
    const { data: prescription, error: prescriptionError } = await supabase
      .from('prescriptions')
      .select(`
        *,
        items:prescription_items (
          id,
          medication_name,
          quantity,
          quantity_dispensed
        )
      `)
      .eq('id', params.id)
      .is('deleted_at', null)
      .single();

    if (prescriptionError || !prescription) {
      return NextResponse.json(
        { error: 'Prescription not found' },
        { status: 404 }
      );
    }

    if (prescription.status === 'filled') {
      return NextResponse.json(
        { error: 'Prescription already fulfilled' },
        { status: 400 }
      );
    }

    // Update prescription items with dispensed quantities
    const updatePromises = items.map(async (item: any) => {
      const { data, error } = await supabase
        .from('prescription_items')
        .update({
          quantity_dispensed: item.quantity_dispensed,
        })
        .eq('id', item.item_id)
        .eq('prescription_id', params.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update item ${item.item_id}`);
      }

      // Check if inventory exists for this medication
      const { data: inventoryItem } = await supabase
        .from('inventory')
        .select('id, stock_quantity')
        .eq('hospital_id', prescription.hospital_id)
        .ilike('medication_name', data.medication_name)
        .is('deleted_at', null)
        .single();

      // If inventory exists, create stock movement and update stock
      if (inventoryItem && item.quantity_dispensed > 0) {
        // Update inventory stock
        const newStock = inventoryItem.stock_quantity - item.quantity_dispensed;
        await supabase
          .from('inventory')
          .update({ stock_quantity: newStock })
          .eq('id', inventoryItem.id);

        // Create stock movement record
        await supabase
          .from('stock_movements')
          .insert({
            inventory_id: inventoryItem.id,
            hospital_id: prescription.hospital_id,
            movement_type: 'dispensed',
            quantity: -item.quantity_dispensed,
            reason: `Prescription ${prescription.prescription_number} fulfilled`,
            performed_by: filled_by,
          });
      }

      return data;
    });

    await Promise.all(updatePromises);

    // Determine final prescription status
    const allItemsFilled = items.every((item: any) => {
      const prescriptionItem = prescription.items.find((pi: any) => pi.id === item.item_id);
      return prescriptionItem && item.quantity_dispensed >= prescriptionItem.quantity;
    });

    const someItemsFilled = items.some((item: any) => item.quantity_dispensed > 0);

    let newStatus = 'pending';
    if (allItemsFilled) {
      newStatus = 'filled';
    } else if (someItemsFilled) {
      newStatus = 'partially_filled';
    } else {
      newStatus = 'out_of_stock';
    }

    // Update prescription status
    const { data: updatedPrescription, error: updateError } = await supabase
      .from('prescriptions')
      .update({
        status: newStatus,
        filled_at: newStatus === 'filled' ? new Date().toISOString() : null,
        filled_by,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select(`
        *,
        items:prescription_items (
          id,
          medication_name,
          dosage,
          frequency,
          quantity,
          quantity_dispensed
        )
      `)
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update prescription status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      prescription: updatedPrescription,
      message: `Prescription ${newStatus === 'filled' ? 'fulfilled' : 'partially fulfilled'} successfully`,
    });
  } catch (error) {
    console.error('Prescription fulfillment error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
