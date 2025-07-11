import {
  Admin,
  CreateAdminData,
  UpdateAdminData,
} from "./models";
import { hashPassword } from "../../../utils/helper.auth";
import {
  NotFoundError,
  ValidationError,
  ConflictError
} from "../../../utils/helper.errors";
import configs from "../../../configs";
import AdminModel from "./models";
import AdminPermissionModel from "../../adminPermission/database/models";
import LogService from "../../log/database/services";

class AdminService {
  private context: any;
  private adminModel: AdminModel;
  private adminPermissionModel: AdminPermissionModel
  private logService: LogService;

  constructor(context: any) {
    this.context = context;
    this.adminModel = new AdminModel(context);
    this.adminPermissionModel = new AdminPermissionModel(context);
    this.logService = new LogService(context);
  }

  /**
   * Initialize default admin
   * @returns Promise<void>
   */
  async init() {
    // Check if admin exists
    const adminExists = await this.adminModel.getAdminByEmail(configs.default_admin_email || "");
    await this.logAdminEvent('system', 'init', 'Check for default admin', 'info');

    if (adminExists) {
      await this.logAdminEvent('system', 'init', 'Default admin already exists', 'info');
      return;
    }

    await this.logAdminEvent(
      'system',
      'init',
      `Creating default admin with email ${configs.default_admin_email}`,
      'info'
    );
    // If not, create default admin
    const result = await this.adminModel.insertAdmin({
      name: configs.default_admin_name || "",
      email: configs.default_admin_email || "",
      password: await hashPassword(configs.default_admin_password ?? ""),
      user_type: "1",
      mobile_number: "",
      country: "",
    })

    if (!result)
      throw new Error('Default admin creation failed');

    await this.logAdminEvent('system', 'create', `Default admin created with email: ${result.email}`, 'info');

    return;
  }

  /**
   * Validate admin data
   * @param data Admin data to validate
   * @returns Promise<void>
   */
  async validateAdmin(data: CreateAdminData): Promise<void> {
    const {
      name,
      email,
      password,
      user_type,
      permissions
    } = data;

    // Check required fields
    if (!name || !email || !password || !user_type) {
      await this.logAdminEvent(
        'system',
        'Missing required fields',
        'Name, email, password, and user type are required',
        'info'
      );
      throw new ValidationError('Name, email, password, and user type are required');
    }

    // Check email format
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      await this.logAdminEvent(
        'system',
        'Invalid email format',
        'Invalid email format',
        'info'
      );
      throw new ValidationError('Invalid email format');
    }

    // Check user type and permissions
    if (user_type !== '1' && !permissions) {
      await this.logAdminEvent(
        'system',
        'Missing permission for non admin users',
        'Permissions are required for non-admin users',
        'info'
      );
      throw new Error('Permissions are required for non-admin users');
    }

    // Check if email already exists
    const existingUser = await this.adminModel.getAdminByEmail(email);
    if (existingUser) {
      await this.logAdminEvent(
        'system',
        'Email already exists',
        'Email already exists',
        'info'
      );
      throw new ConflictError('Email already exists');
    }

    return;
  }

  /**
   * Create a new admin
   * @param data Admin data to create a new admin
   * @returns Promise Admin
   */
  async createAdmin(data: CreateAdminData): Promise<Admin> {
    const {
      name,
      email,
      password,
      user_type,
      mobile_number,
      country,
      permissions
    } = data;

    await this.logAdminEvent(
      'system',
      'create admin',
      'Validating admin data',
      'info'
    );
    // Validate data
    await this.validateAdmin(data);

    const hashedPassword = await hashPassword(password);

    await this.logAdminEvent(
      'system',
      'create admin',
      'Creating admin',
      'info'
    );
    // Insert admin
    const result = await this.adminModel.insertAdmin({
      name,
      email,
      password: hashedPassword,
      user_type,
      mobile_number,
      country,
    });

    if (!result)
      throw new Error('User creation failed');

    await this.logAdminEvent(
      'system',
      'create admin permission',
      'Inserting admin permission',
      'info'
    );
    // Insert permission if is not admin
    if (user_type !== '1')
      await this.adminPermissionModel.insertAdminPermission({
        admin_id: result.id,
        permissionIds: permissions ?? []
      });

    // Log the admin creation
    await this.logAdminEvent(
      'system',
      'create admin',
      `Admin created with email: ${result.email}`,
      'info'
    );

    return result;
  }

  /**
   * Update admin profile
   * @param id Admin ID
   * @param data Admin data to update
   * @returns Promise Admin
   */
  async updateAdminProfile(data: Partial<UpdateAdminData>): Promise<Admin> {
    const id = this.context.currentUser.id;

    const user = await this.adminModel.getAdminById(id);
    if (!user)
      throw new NotFoundError('User not found');

    const { name, email, newPassword, mobile_number, country } = data;
    // Check if name and email are provided
    if (!name || !email) {
      await this.logAdminEvent(
        id,
        'update admin profile',
        'Name and email are required',
        'info'
      );
      throw new NotFoundError('Name and email are required');
    }

    // If have new password
    let result;
    if (newPassword) {
      const hashedPassword = await hashPassword(newPassword);
      result = await this.adminModel.updateAdminProfileWithPassword(id, {
        name,
        email,
        newPassword: hashedPassword,
        mobile_number,
        country
      });

      await this.logAdminEvent(
        id,
        'update admin profile',
        'Updating admin profile with password',
        'info'
      );
    } else {
      result = await this.adminModel.updateAdminProfile(id, data);
      await this.logAdminEvent(
        id,
        'update admin profile',
        'Updating admin profile',
        'info'
      );
    }

    if (!result)
      throw new Error('User update failed');

    // Log the admin profile update
    await this.logAdminEvent(
      id,
      'update admin profile',
      `Admin profile updated for ID: ${id}`,
      'info'
    );

    return result;
  }

  /**
   * Log admin event
   * @access private
   * @param user User ID
   * @param action Action
   * @param details Details
   * @param level Level
   */
  private async logAdminEvent(
    user: string,
    action: string,
    details: string,
    level: 'info' | 'warn' | 'error' = 'info'
  ) {
    await this.logService.insertLog({
      user,
      action,
      details,
      component: 'admin',
      level
    });
  }
}

export default AdminService;
