import { Router } from 'express';
import { successResponse } from '../../utils/helper.response';
import { JwtPayload } from './database/models';
import { ValidationError } from '../../utils/helper.errors';
import { ipControl } from '../../middleware/ipControl';
import passport from 'passport';
import AuthService from './database/services';
import UserService from '../users/database/services';
import UserModel from '../users/database/models';
import AdminService from '../admin/database/services';
import AdminModel from '../admin/database/models';

const authController = (context: any) => {
  const router = Router();
  const authService = new AuthService(context);
  const userService = new UserService(context);
  const userModel = new UserModel(context);
  const adminService = new AdminService(context);
  const adminModel = new AdminModel(context);

  /**
   * Register user
   */
  router.post('/register', async (req, res, next) => {
    try {
      const validate = await userService.validation(req.body);
      if (!validate)
        throw new ValidationError('Validation failed');

      // Register user
      await userService.createNewUser(req.body);
      res.status(200).json({success: true, msg: 'User registered successfully'});
    } catch (err) {
      next(err);
    }
  });

  /**
   * Login user
   */
  router.post('/login', async (req, res, next) => {
    try {
      const { email, password } = req.body;
      // add role in token
      const { token, user } = await authService.login(email, password);
      const options = {
        expires: new Date(Date.now() + 86400000), // 1 day
        httpOnly: true, // prevent access to the cookie from javascript
      };
      res.status(200).cookie('token', token, options).json({success: true, msg: 'User logged in successfully', token});
    } catch (err) {
      next(err);
    }
  });

  /**
   * Admin login
   */
  router.post('/admin/login', ipControl(context), async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const { token, user } = await authService.adminLogin(email, password);
      res.status(200).json(successResponse({ token, user }));
    } catch (err) {
      next(err);
    }
  });

  /**
   * Google login
   */
  router.get('/google', passport.authenticate('google', { scope: ['email', 'profile'] }));

  /**
   * Google callback
   */
  router.get('/user/callback',
    passport.authenticate('google', { failureRedirect: '/login', session: false }), async (req, res, next) => {
      try {
        // Successful authentication
        if (!req.user) {
          res.status(401).json({ error: 'User not authenticated' });
        }

        await userModel.updateLastLogin((req.user as any).id);

        const user = {
          id: (req.user as any).id,
          email: (req.user as any).email,
        };
        const userId = user.id.toString();
        const payload: JwtPayload = {
          id: userId,
          email: user.email,
          role: 'user',
        };
        const token = await authService.signToken(payload);
        const options = {
          expires: new Date(Date.now() + 86400000), // 1 day
          httpOnly: true, // prevent access to the cookie from javascript
        };
        res.status(200).cookie('token', token, options).redirect(`http://localhost:3001/?token=${token}`);
      } catch (err) {
        next(err);
      }
    }
  );

  /**
   * Google admin login
   */
  router.get('/google-admin', passport.authenticate('google-admin', { scope: ['email', 'profile'] }));

  /**
   * Google admin callback
   */
  router.get('/admin/callback',
    passport.authenticate('google-admin', { failureRedirect: '/dashboard', session: false }), async (req, res, next) => {
      try {
        // Successful authentication
        if (!req.user) {
          res.status(401).json({ error: 'User not authenticated' });
        }

        await adminModel.updateAdminLastLogin((req.user as any).id);

        const user = {
          id: (req.user as any).id,
          email: (req.user as any).email,
        };
        const userId = user.id.toString();
        const payload: JwtPayload = {
          id: userId,
          email: user.email,
          role: 'admin',
        };
        const token = await authService.signToken(payload);
        res.status(200).json(successResponse({ token, user }));
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
};

export default authController;
