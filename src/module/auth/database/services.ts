import { User, Admin, JwtPayload } from './models';
import { ValidationError } from '../../../utils/helper.errors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserService from '../../users/database/services';
import UserModel from '../../users/database/models';
import AdminModel from '../../admin/database/models';
import AdminPermissionModel from '../../adminPermission/database/models';
import LogService from '../../log/database/services';
import configs from '../../../configs';

class AuthService {
  private context: any;
  private userService: UserService;
  private userModel: UserModel;
  private adminModel: AdminModel;
  private adminPermissionModel: AdminPermissionModel;
  private logService: LogService;
  private jwtSecret: string = configs.JWT_SECRET as string;

  constructor(context: any) {
    this.context = context;
    this.userService = new UserService(context);
    this.userModel = new UserModel(context);
    this.adminModel = new AdminModel(context);
    this.adminPermissionModel = new AdminPermissionModel(context);
    this.logService = new LogService(context);
  }

  /**
   * User login
   * @param email User email
   * @param password User password
   * @returns Promise AuthResponse
   */
  async login(email: string, password: string): Promise<User> {
    // Validate input
    if (!email || !password) {
      await this.logAuthEvent(
        email,
        'login',
        'Username and password are required',
        'error'
      );
      throw new ValidationError('Username and password are required');
    }

    // Fetch user by email
    const user = await this.userModel.getUserByEmail(email.toLowerCase());
    if (!user?.id) {
      await this.logAuthEvent(
        email,
        'login',
        'Invalid credentials',
        'error'
      );
      throw new ValidationError('Invalid credentials');
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await this.logAuthEvent(
        email,
        'login',
        'Invalid credentials',
        'error'
      );
      throw new ValidationError('Invalid credentials');
    }

    await this.logAuthEvent(
      email,
      'check user credit',
      'Check and update user credit',
      'info'
    );
    // Check user account credit last reset
    await this.userService.checkAndUpdateLastReset(user.id);

    // Update last login
    await this.userModel.updateLastLogin(user.id);

    await this.logAuthEvent(
      email,
      'login',
      'Update last login',
      'info'
    );

    const userId = user.id;
    const payload: JwtPayload = {
      id: Number(userId),
      email: user.email,
      role: 'user',
    };

    // Generate JWT token
    const token = await this.signToken(payload);
    // update last login time

    await this.logAuthEvent(
      email,
      'login',
      'User logged in',
      'info'
    );

    return {
      token,
      user: {
        id: Number(userId),
        email: user.email,
      },
    };
  }

  /**
   * Admin login
   * @param email Admin email
   * @param password Admin password
   * @returns Promise Admin
   */
  async adminLogin(email: string, password: string): Promise<Admin> {
    if (!email || !password) {
      await this.logAuthEvent(
        this.context.currentUser.id,
        'login',
        'Username and password are required',
        'error'
      );
      throw new ValidationError('Username and password are required');
    }

    const admin = await this.adminModel.getAdminByEmail(email.toLowerCase());
    if (!admin?.id) {
      await this.logAuthEvent(
        this.context.currentUser.id,
        'login',
        'Invalid credentials',
        'error'
      );
      throw new ValidationError('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      await this.logAuthEvent(
        this.context.currentUser.id,
        'login',
        'Invalid credentials',
        'error'
      );
      throw new ValidationError('Invalid credentials');
    }

    // Set permissions and admin status
    let isAdmin = false, permissions;
    if (admin.user_type === '1') {
      isAdmin = true;

      await this.logAuthEvent(
        admin.id.toString(),
        'login',
        'Admin logged in',
        'info'
      );
    } else {
      permissions = await this.adminPermissionModel.getAdminPermissionById(admin.id);

      await this.logAuthEvent(
        admin.id.toString(),
        'ADMIN_PERMISSION_LOADED',
        `Loaded ${permissions?.length || 0} permissions`,
        'info'
      );
    }

    // Update last login
    await this.adminModel.updateAdminLastLogin(admin.id);

    await this.logAuthEvent(
      admin.id.toString(),
      'login',
      'Update last login',
      'info'
    );

    const adminId = admin.id;
    const payload: JwtPayload = {
      id: Number(adminId),
      email: admin.email,
      role: 'admin',
      isAdmin: isAdmin,
      permissions: permissions?.map(p => p.permission).flat(),
    };

    const token = await this.signToken(payload);
    
    await this.logAuthEvent(
      admin.id.toString(),
      'login',
      'Admin logged in',
      'info'
    );

    return {
      token,
      user: {
        id: Number(adminId),
        email: admin.email,
        isAdmin: isAdmin,
        permissions: permissions?.map(p => p.permission).flat(),
      },
    };
  }

  /**
   * Sign JWT token
   * @param payload JWT payload
   * @returns Promise string
   */
  async signToken(payload: JwtPayload): Promise<string> {
    return jwt.sign(payload, this.jwtSecret, { expiresIn: '1d' });
  }

  /**
   * Verify JWT token
   * @param token JWT token
   * @returns Promise JwtPayload
   */
  async verifyToken(token: string): Promise<JwtPayload> {
    return jwt.verify(token, this.jwtSecret) as JwtPayload;
  }

  /**
   * Log auth event
   * @access private
   * @param user User ID
   * @param action Action
   * @param details Details
   * @param level Level
   */
  private async logAuthEvent(
    user: string,
    action: string,
    details: string,
    level: string
  ) {
    await this.logService.insertLog({
      user: user,
      action: action,
      details: details,
      component: 'auth',
      level: level
    });
  }
}

export default AuthService;
