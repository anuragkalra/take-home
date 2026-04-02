import { type Request, type Response, type NextFunction } from 'express';

// TODO: Add sponsorId and publisherId to the user interface
// These are needed to scope queries to the user's own data
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'SPONSOR' | 'PUBLISHER';
    // FIXME: Missing sponsorId and publisherId fields
  };
}

// TODO: This middleware doesn't actually validate anything!
// It should:
// 1. Check for Authorization header or session cookie
// 2. Validate the token/session
// 3. Look up the user in the database
// 4. Attach user info to req.user
// 5. Return 401 if invalid
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  // Better Auth will handle validation via headers
  // This is a placeholder for protected routes
  next();
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
