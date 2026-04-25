import type { Request } from 'express';
import { getAuth } from './firebase-admin';
import { HttpError } from '../http';

export interface AuthUser {
  uid: string;
  email: string;
  name: string;
}

export async function verifyRequest(req: Request): Promise<AuthUser | null> {
  const header = req.headers['authorization'];
  if (!header?.startsWith('Bearer ')) return null;

  const token = header.slice(7);
  try {
    const decoded = await getAuth().verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email ?? '',
      name: (decoded['name'] as string | undefined) ?? '',
    };
  } catch {
    return null;
  }
}

export async function requireAuth(req: Request): Promise<AuthUser> {
  const user = await verifyRequest(req);
  if (!user) throw new HttpError(401, 'UNAUTHORIZED', 'Valid authentication token required');
  return user;
}
