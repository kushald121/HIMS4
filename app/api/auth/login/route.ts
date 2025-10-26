import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { verifyPassword, generateToken, hashToken } from '@/app/utils/crypto';
import { successResponse, errorResponse } from '@/app/utils/response';

// This ensures the route is always dynamically rendered
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('Login attempt for email:', email);

    if (!email || !password) {
      return errorResponse('Email and password are required');
    }

    // Check if Supabase client is properly initialized
    if (!supabaseAdmin) {
      console.error('Supabase admin client not initialized');
      return errorResponse('Authentication service unavailable', 500);
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .is('deleted_at', null)
      .maybeSingle();

    if (userError) {
      console.error('Supabase query error:', userError);
      return errorResponse('Authentication service error', 500);
    }

    console.log('User found:', !!user);

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
    // Fix for IP address - handle empty strings properly
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Prepare session data with proper handling of IP address
    const sessionData: any = {
      user_id: user.id,
      token_hash: tokenHash,
      device_info: { userAgent },
      expires_at: expiresAt.toISOString()
    };

    // Only add IP address if it's not null/empty
    if (ip) {
      sessionData.ip_address = ip;
    }

    const { error: sessionError } = await supabaseAdmin.from('user_sessions').insert(sessionData);

    if (sessionError) {
      console.error('Session creation error:', sessionError);
      return errorResponse('Failed to create session', 500);
    }

    const { data: hospitalUsers, error: hospitalError } = await supabaseAdmin
      .from('hospital_users')
      .select('hospital_id, role, hospitals(name)')
      .eq('user_id', user.id)
      .is('deleted_at', null);

    if (hospitalError) {
      console.error('Hospital user query error:', hospitalError);
    }

    // Remove password hash from user object before sending to client
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password_hash;

    return successResponse({
      token,
      user: userWithoutPassword,
      hospitals: hospitalUsers || []
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}