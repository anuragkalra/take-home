import { type Request, type Response, type NextFunction } from 'express';
import { betterAuth } from 'better-auth';
import { fromNodeHeaders } from 'better-auth/node';
import { Pool } from 'pg';
import { prisma } from './db.js';

// Better Auth instance for server-side session validation.
// Must share the same secret and database as the frontend instance so that
// session tokens created by the Next.js auth handler are accepted here.
const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL! }),
  secret: process.env.BETTER_AUTH_SECRET || 'fallback-secret-for-dev',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3847',
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
  },
  advanced: {
    disableCSRFCheck: true,
  },
});

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'SPONSOR' | 'PUBLISHER';
    sponsorId?: string;
    publisherId?: string;
  };
}

// Validates the Better Auth session cookie, looks up the caller's sponsor or
// publisher record, and attaches the result to req.user.  Returns 401 if no
// valid session is present.
export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userId = session.user.id;

    const [sponsor, publisher] = await Promise.all([
      prisma.sponsor.findUnique({ where: { userId }, select: { id: true } }),
      prisma.publisher.findUnique({ where: { userId }, select: { id: true } }),
    ]);

    if (!sponsor && !publisher) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    req.user = {
      id: userId,
      email: session.user.email,
      role: sponsor ? 'SPONSOR' : 'PUBLISHER',
      sponsorId: sponsor?.id,
      publisherId: publisher?.id,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
}

export function roleMiddleware(allowedRoles: Array<'SPONSOR' | 'PUBLISHER'>) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
