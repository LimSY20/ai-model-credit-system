import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import passport from 'passport';
import configs from '../configs';
import UserService from '../module/users/database/services';
import UserModel from '../module/users/database/models';
import AdminModel from '../module/admin/database/models';
import LogService from '../module/log/database/services';

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
  try {
    await logService.insertLog({
      user: user || 'system',
      action,
      details,
      component: 'auth',
      level
    });
  } catch (logError) {
    console.error('Failed to log auth event:', logError);
  }
}

passport.use(new GoogleStrategy({
    clientID: configs.GOOGLE_CLIENT_ID as string,
    clientSecret: configs.GOOGLE_CLIENT_SECRET as string,
    callbackURL: "http://localhost:3000/api/auth/user/callback"
  },

  async function(accessToken, refreshToken, profile, done) {
    const userService = new UserService(null);
    const userModel = new UserModel(null);

    try {
      // Check if email is provided
      const userEmail = profile.emails?.[0]?.value;
      if (!userEmail) {
        await logAuthEvent('system', 'GOOGLE_AUTH_FAILED', 'No email in Google profile', 'warn');
        return done(null, false, { message: 'No email provided by Google' });
      }

      await logAuthEvent('system', 'GOOGLE_AUTH_ATTEMPT', `Authentication attempt for email: ${userEmail}`, 'info');

      try {
        // Check if user exists
        let user: any = null;
        user = await userModel.getUserByEmail(profile.emails![0].value);
        await logAuthEvent(user?.id || 'unknown', 'USER_FOUND', 'User found in database', 'info');

        // If user not exists, create a new user
        if (!user) {
          user = await userService.createNewUser({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails![0].value,
            password: ''
          });
          await logAuthEvent(user.id, 'USER_CREATED', 'New user create via Google OAuth', 'info');
        }

        await logAuthEvent(user.id, 'AUTH_SUCCESS', 'Google authentication successful', 'info');
        // Return user to req.user
        return done(null, user);
      } catch (err: any) {
        await logAuthEvent('system', 'AUTH_ERROR', `Authentication failed: ${err}`, 'error');
        return done(err);
      }
    } catch (err: any) {
      await logAuthEvent('system', 'AUTH_ERROR', `Authentication failed: ${err}`, 'error');
      return done(err);
    }
  })
);

passport.use('google-admin', new GoogleStrategy({
    clientID: configs.GOOGLE_CLIENT_ID as string,
    clientSecret: configs.GOOGLE_CLIENT_SECRET as string,
    callbackURL: "http://localhost:3000/api/auth/admin/callback"
  },
  async function(accessToken, refreshToken, profile, done) {
    const adminModel = new AdminModel(null);

    try {
      const email = profile.emails![0].value;
      if (!email) {
        await logAuthEvent('system', 'GOOGLE_AUTH_FAILED', 'No email in Google profile', 'warn');
        return done(null, false, { message: 'No email from google profile' });
      }

      await logAuthEvent('system', 'GOOGLE_AUTH_ATTEMPT', `Authentication attempt for email: ${email}`, 'info');

      const admin = await adminModel.getAdminByEmail(email);

      if (!admin) {
        await logAuthEvent('system', 'ADMIN_NOT_FOUND', `No admin found for email: ${email}`, 'info');
        return done(null, false, { message: 'Admin not found' });
      }

      if (admin?.googleId && admin.googleId !== profile.id) {
        await logAuthEvent('system', 'ADMIN_ALREADY_REGISTERED', `Admin already registered with Google`, 'warn');
        return done(null, false, { message: 'Admin already registered with Google' });
      }

      if (!admin.googleId) {
        await logAuthEvent('system', 'ADMIN_REGISTERED', `Admin registered with Google`, 'info');
        await adminModel.updateAdminGoogleId(email, profile.id!);
        admin.googleId = profile.id;
      }

      await logAuthEvent(admin.id.toString(), 'AUTH_SUCCESS', 'Google authentication successful', 'info');
      return done(null, admin);
    } catch (err: any) {
      await logAuthEvent('system', 'AUTH_ERROR', `Authentication failed: ${err}`, 'error');
      return done(err);
    }
  })
);

// Dont need serialize and deserialize since not using session
