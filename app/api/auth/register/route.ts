import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { hashPassword } from '@/app/utils/crypto';
import { successResponse, errorResponse } from '@/app/utils/response';

// This ensures the route is always dynamically rendered
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, first_name, last_name, phone } = body;

    console.log('Registration attempt for email:', email);

    if (!email || !password) {
      return errorResponse('Email and password are required');
    }

    // Check if Supabase client is properly initialized
    if (!supabaseAdmin) {
      console.error('Supabase admin client not initialized');
      return errorResponse('Registration service unavailable', 500);
    }

    const { data: existingUser, error: existingUserError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .is('deleted_at', null)
      .maybeSingle();

    if (existingUserError) {
      console.error('Supabase query error:', existingUserError);
      return errorResponse('Registration service error', 500);
    }

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
      console.error('User creation error:', error);
      return errorResponse(error.message || 'Failed to create user');
    }

    return successResponse({ user }, 201);
  } catch (error: any) {
    console.error('Registration error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}