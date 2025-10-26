import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { User, HospitalUser } from '@/app/types';
import { hashToken } from '@/app/utils/crypto';

export interface AuthContext {
  user: User;
  hospitalUser?: HospitalUser;
  hospitalId?: number;
}

export async function authenticate(request: NextRequest): Promise<AuthContext | null> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const tokenHash = hashToken(token);

  const { data: session } = await supabaseAdmin
    .from('user_sessions')
    .select('*, users(*)')
    .eq('token_hash', tokenHash)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (!session) {
    return null;
  }

  await supabaseAdmin
    .from('user_sessions')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', session.id);

  const user = session.users as unknown as User;

  const hospitalIdHeader = request.headers.get('x-hospital-id');
  if (hospitalIdHeader) {
    const hospitalId = parseInt(hospitalIdHeader);
    const { data: hospitalUser } = await supabaseAdmin
      .from('hospital_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('hospital_id', hospitalId)
      .is('deleted_at', null)
      .maybeSingle();

    if (hospitalUser) {
      return {
        user,
        hospitalUser: hospitalUser as HospitalUser,
        hospitalId
      };
    }
  }

  return { user };
}

export async function requireAuth(request: NextRequest): Promise<AuthContext> {
  const auth = await authenticate(request);
  if (!auth) {
    throw new Error('Unauthorized');
  }
  return auth;
}

export async function requireRole(
  request: NextRequest,
  allowedRoles: string[]
): Promise<AuthContext> {
  const auth = await requireAuth(request);

  if (!auth.hospitalUser || !allowedRoles.includes(auth.hospitalUser.role)) {
    throw new Error('Forbidden');
  }

  return auth;
}
