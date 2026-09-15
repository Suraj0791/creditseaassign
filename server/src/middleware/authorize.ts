import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User';

/**
 * RBAC middleware — restricts route access to specified roles.
 * Must be used AFTER authenticate middleware.
 *
 * Usage: authorize(UserRole.ADMIN, UserRole.SANCTION)
 */
const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      res.status(403).json({
        message: 'You do not have permission to access this resource.',
      });
      return;
    }

    next();
  };
};

export default authorize;
