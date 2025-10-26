import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { hashToken } from '@/app/utils/crypto';
import { successResponse, errorResponse, unauthorizedResponse } from '@/app/utils/response';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedResponse();
    }

    const token = authHeader.substring(7);
    const tokenHash = hashToken(token);

    const { error } = await supabaseAdmin
      .from('user_sessions')
      .delete()
      .eq('token_hash', tokenHash);

    if (error) {
      return errorResponse(error.message);
    }

    return successResponse({ message: 'Logged out successfully' });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
