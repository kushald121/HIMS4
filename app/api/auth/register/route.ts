import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { hashPassword } from '@/app/utils/crypto';
import { successResponse, errorResponse } from '@/app/utils/response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, first_name, last_name, phone } = body;

    if (!email || !password) {
      return errorResponse('Email and password are required');
    }

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .is('deleted_at', null)
      .maybeSingle();

    if (existingUser) {
      return errorResponse('User already exists', 409);
    }

    const passwordHash = await hashPassword(password);

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        first_name,
        last_name,
        phone,
        email_verified: false
      })
      .select()
      .single();

    if (error) {
      return errorResponse(error.message);
    }

    return successResponse({ user }, 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
