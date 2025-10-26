import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { verifyPassword, generateToken, hashToken } from '@/app/utils/crypto';
import { successResponse, errorResponse } from '@/app/utils/response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse('Email and password are required');
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .is('deleted_at', null)
      .maybeSingle();

    if (!user || !user.password_hash) {
      return errorResponse('Invalid credentials', 401);
    }

    const isValidPassword = await verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      return errorResponse('Invalid credentials', 401);
    }

    const token = generateToken();
    const tokenHash = hashToken(token);

    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await supabaseAdmin.from('user_sessions').insert({
      user_id: user.id,
      token_hash: tokenHash,
      device_info: { userAgent },
      ip_address: ip,
      expires_at: expiresAt.toISOString()
    });

    const { data: hospitalUsers } = await supabaseAdmin
      .from('hospital_users')
      .select('hospital_id, role, hospitals(name)')
      .eq('user_id', user.id)
      .is('deleted_at', null);

    delete user.password_hash;

    return successResponse({
      token,
      user,
      hospitals: hospitalUsers
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
