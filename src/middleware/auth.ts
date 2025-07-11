import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../utils/helper.errors';
import jwt from 'jsonwebtoken';
import configs from '../configs';
import { JwtPayload } from '../module/auth/database/models';
import UserModel from '../module/users/database/models';
import AdminModel from '../module/admin/database/models';
import LogService from '../module/log/database/services';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const logService = new LogService(null);

/**
 * Log authentication event
 * @param user User ID
 * @param action Action
 * @param details Details
 * @param level Level
 */
async function logAuthEvent(
  user: string,
  action: string,
  details: string,
  level: 'info' | 'warn' | 'error' = 'info'
) {
  await logService.insertLog({
    user: user || 'system',
    action,
    details,
    component: 'auth',
    level
  });
}

/**
 * Verify JWT token
 * @param token JWT token
 * @returns Promise string
 */
async function verify(token: string): Promise<any> {
  try {
    if (!token) {
      await logAuthEvent('system', 'AUTH_FAILED', 'No token provided', 'warn');
      throw new UnauthorizedError('Authentication required');
    }

    // Verify token
    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token as string, configs.JWT_SECRET as string, (err: any, decoded: any) => {
        if (err) {
          const errorType = err.name === 'TokenExpiredError' ? 'Expired token' : 'Invalid token';
          logAuthEvent(
            'system',
            'TOKEN_VERIFICATION_FAILED',
            `${errorType}: ${err.message}`,
            'warn'
          );
          return reject(new Error(errorType));
        }
        resolve(decoded);
      });
    }) as { id: string, email: string };

    // If no user ID found in token
    if (!decoded?.id) {
      await logAuthEvent('system', 'INVALID_TOKEN', 'Token missing user ID', 'warn');
      throw new UnauthorizedError('Invalid token');
    }

    // Log token verification success
    await logAuthEvent(
      decoded.id,
      'TOKEN_VERIFIED',
      'Token verified successfully',
      'info'
    );
    return decoded;
  } catch (err) {
    await logAuthEvent(
      'system',
      'TOKEN_VERIFICATION_ERROR', 
      `Token verification failed: ${err}`,
      'error'
    );
    throw err;
  }
}

/**
 * User authentication middleware
 * @param context 
 * @returns 
 */
export function authentication (context: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Log user authentication attempt
      await logAuthEvent(
        'system',
        'AUTH_ATTEMPT',
        'User authentication started',
        'info'
      );

      const token = req.cookies?.token || req.headers['authorization']?.split(' ')[1];
      const decoded = await verify(token);
      const userModel = new UserModel(context);
      const user = await userModel.getUserById(decoded.id);
      
      if (!user.id) {
        // Log user not found
        await logAuthEvent(
          decoded.id,
          'USER_NOT_FOUND',
          'User not found in database',
          'warn'
        );
        throw new UnauthorizedError('User not found');
      }

      const currentUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'user',
      };

      if (context) context.currentUser = req.user = currentUser;

      // Log user authentication success
      await logAuthEvent(
        user.id.toString(),
        'AUTH_SUCCESS',
        `User authenticated: ${user.email}`,
        'info'
      );
      next();
    } catch (err) {
      // Log authentication error
      await logAuthEvent(
        'system',
        'AUTH_ERROR',
        `Authentication failed: ${err}`,
        'error'
      );
      next(err);
    }
  }
}

/**
 * Admin authentication middleware
 * @param context 
 * @returns 
 */
export function adminAuthentication (context: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Log admin authentication attempt
      await logAuthEvent(
        'system',
        'ADMIN_AUTH_ATTEMPT',
        'Admin authentication started',
        'info'
      );

      const token = req.cookies?.token || req.headers['authorization']?.split(' ')[1];
      const decoded = await verify(token);
      const adminModel = new AdminModel(context);
      const user = await adminModel.getAdminById(decoded.id);
      if (!user) {
        // Log admin not found
        await logAuthEvent(
          decoded.id,
          'ADMIN_NOT_FOUND',
          'Admin user not found',
          'warn'
        );
        throw new UnauthorizedError('User not found');
      }

      const currentUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'admin',
        permissions: decoded.permissions,
        isAdmin: decoded.isAdmin,
      };

      if (context) context.currentUser = req.user = currentUser;

      // Log admin authentication success
      await logAuthEvent(
        user.id.toString(),
        'ADMIN_AUTH_SUCCESS', 
        `Admin authenticated: ${user.email} (${decoded.isAdmin ? 'Super Admin' : 'Limited Admin'})`,
        'info'
      );
      next();
    } catch (err) {
      // Log admin authentication error
      await logAuthEvent(
        'system',
        'ADMIN_AUTH_ERROR', 
        `Admin authentication failed: ${err}`,
        'error'
      );
      next(err);
    }
  }
}
