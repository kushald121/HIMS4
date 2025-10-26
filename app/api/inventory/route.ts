import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { requireRole } from '@/app/middleware/auth';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/app/utils/response';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['admin', 'pharmacist']);

    const { searchParams } = new URL(request.url);
    const lowStock = searchParams.get('low_stock') === 'true';
    const search = searchParams.get('search');

    let query = supabaseAdmin
      .from('inventory')
      .select('*')
      .eq('hospital_id', auth.hospitalId!)
      .is('deleted_at', null)
      .order('medication_name');

    if (lowStock) {
      query = query.lte('stock_quantity', supabaseAdmin.rpc('reorder_threshold'));
    }

    if (search) {
      query = query.or(`medication_name.ilike.%${search}%,generic_name.ilike.%${search}%`);
    }

    const { data: inventory, error } = await query;

    if (error) {
      return errorResponse(error.message);
    }

    return successResponse({ inventory });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Forbidden') {
      return forbiddenResponse();
    }
    return errorResponse(error.message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['admin', 'pharmacist']);
    const body = await request.json();

    const { data: inventory, error } = await supabaseAdmin
      .from('inventory')
      .insert({
        hospital_id: auth.hospitalId!,
        medication_name: body.medication_name,
        generic_name: body.generic_name,
        category: body.category,
        manufacturer: body.manufacturer,
        batch_number: body.batch_number,
        expiry_date: body.expiry_date,
        stock_quantity: body.stock_quantity || 0,
        reorder_threshold: body.reorder_threshold || 10,
        unit_price: body.unit_price,
        created_by: auth.hospitalUser!.id
      })
      .select()
      .single();

    if (error) {
      return errorResponse(error.message);
    }

    return successResponse({ inventory }, 201);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Forbidden') {
      return forbiddenResponse();
    }
    return errorResponse(error.message, 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['admin', 'pharmacist']);
    const body = await request.json();
    const { id, stock_quantity } = body;

    if (!id || stock_quantity === undefined) {
      return errorResponse('ID and stock_quantity are required');
    }

    const { data: inventory, error } = await supabaseAdmin
      .from('inventory')
      .update({ stock_quantity, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('hospital_id', auth.hospitalId!)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      return errorResponse(error.message);
    }

    return successResponse({ inventory });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Forbidden') {
      return forbiddenResponse();
    }
    return errorResponse(error.message, 500);
  }
}
