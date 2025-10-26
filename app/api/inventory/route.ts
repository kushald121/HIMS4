import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const lowStock = searchParams.get('low_stock') === 'true';
    const expiringSoon = searchParams.get('expiring_soon') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('inventory')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('medication_name', { ascending: true });

    // Apply filters
    if (search) {
      query = query.or(`medication_name.ilike.%${search}%,generic_name.ilike.%${search}%`);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (lowStock) {
      query = query.lte('stock_quantity', 100);
    }
    if (expiringSoon) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      query = query.lte('expiry_date', thirtyDaysFromNow.toISOString()).gte('expiry_date', new Date().toISOString());
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: inventory, error, count } = await query;

    if (error) {
      console.error('Error fetching inventory:', error);
      return NextResponse.json(
        { error: 'Failed to fetch inventory' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      inventory: inventory || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Inventory fetch error:', error);
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
      hospital_id,
      medication_name,
      generic_name,
      category,
      manufacturer,
      batch_number,
      expiry_date,
      stock_quantity,
      reorder_threshold,
      unit_price,
      selling_price,
      storage_location,
      description,
    } = body;

    // Validate required fields
    if (!hospital_id || !medication_name || stock_quantity === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: hospital_id, medication_name, stock_quantity' },
        { status: 400 }
      );
    }

    // Create inventory item
    const { data: inventoryItem, error } = await supabase
      .from('inventory')
      .insert({
        hospital_id,
        medication_name,
        generic_name,
        category,
        manufacturer,
        batch_number,
        expiry_date,
        stock_quantity,
        reorder_threshold: reorder_threshold || 50,
        unit_price,
        selling_price,
        storage_location,
        description,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating inventory item:', error);
      return NextResponse.json(
        { error: 'Failed to create inventory item' },
        { status: 500 }
      );
    }

    // Create initial stock movement record
    await supabase
      .from('stock_movements')
      .insert({
        inventory_id: inventoryItem.id,
        hospital_id,
        movement_type: 'received',
        quantity: stock_quantity,
        reason: 'Initial stock',
      });

    return NextResponse.json({
      inventory: inventoryItem,
      message: 'Inventory item created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Inventory creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/inventory - Update stock quantity
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, stock_quantity, reason, performed_by } = body;

    if (!id || stock_quantity === undefined) {
      return NextResponse.json(
        { error: 'ID and stock_quantity are required' },
        { status: 400 }
      );
    }

    // Get current inventory
    const { data: currentInventory, error: fetchError } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !currentInventory) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }

    const quantityDifference = stock_quantity - currentInventory.stock_quantity;

    // Update inventory stock
    const { data: inventory, error } = await supabase
      .from('inventory')
      .update({ 
        stock_quantity, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update inventory' },
        { status: 500 }
      );
    }

    // Create stock movement record
    if (quantityDifference !== 0) {
      await supabase
        .from('stock_movements')
        .insert({
          inventory_id: id,
          hospital_id: currentInventory.hospital_id,
          movement_type: quantityDifference > 0 ? 'adjustment_in' : 'adjustment_out',
          quantity: quantityDifference,
          reason: reason || 'Manual adjustment',
          performed_by,
        });
    }

    return NextResponse.json({
      inventory,
      message: 'Inventory updated successfully',
    });
  } catch (error) {
    console.error('Inventory update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
