import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response.util';

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      errorResponse(
        res,
        'FORBIDDEN',
        'You do not have permission to access this resource',
        403
      );
      return;
    }

    next();
  };
};