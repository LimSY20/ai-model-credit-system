import { ValidationError, NotFoundError } from "../../../utils/helper.errors";
import { Permission, PermissionData, AdminPermissionData } from "./models";
import AdminPermissionModel from "./models";
import LogService from "../../log/database/services";

class AdminPermissionService {
  private context: any;
  private adminPermissionModel: AdminPermissionModel;
  private logService: LogService;

  constructor(context: any) {
    this.context = context;
    this.adminPermissionModel = new AdminPermissionModel(context);
    this.logService = new LogService(context);
  }

  /**
   * Get permissions
   * @returns Promise Permission[]
   */
  async getPermission(): Promise<Permission[]> {
    const result = await this.adminPermissionModel.getAllPermissions();

    await this.logAdminPermissionEvent(
      this.context.currentUser.id,
      'get_permission',
      'Get permission',
      'info'
    );

    if (!result)
      throw new NotFoundError('No permissions found');
    return result;
  }

  /**
   * Edit permission
   * @param data Permission data
   * @returns Promise Permission
   */
  async editPermission(data: PermissionData): Promise<Permission[]> {
    const { permission_id, permission } = data;
    if (!permission_id || !permission) {
      await this.logAdminPermissionEvent(
        this.context.currentUser.id,
        'edit_permission',
        'Permission ID and permission are required',
        'error'
      );
      throw new ValidationError('Permission ID and permission are required');
    }

    const result = await this.adminPermissionModel.updatePermission(data);
    if (!result)
      throw new Error('Update failed');

    // Log the permission update
    await this.logAdminPermissionEvent(
      this.context.currentUser.id,
      'edit_permission',
      `Permission updated with ID: ${permission_id}`,
      'info'
    );

    return result;
  }

  /**
   * Get admin permission
   * @returns Promise AdminPermission[]
   */
  async getAdminPermission() {
    const result = await this.adminPermissionModel.getPermissionAndAdminPermissions();

    await this.logAdminPermissionEvent(
      this.context.currentUser.id,
      'get_admin_permission',
      'Get admin permission',
      'info'
    );

    if (!result)
      throw new Error('No admin permissions found');
    return result;
  }

  /**
   * Edit admin permission
   * @param data AdminPermission data
   * @returns Promise AdminPermission[]
   */
  async editAdminPermission(data: AdminPermissionData) {
    const { admin_id, permissionIds } = data;
    // Check if permissionIds is provided
    if (!permissionIds || permissionIds.length === 0) {
      await this.logAdminPermissionEvent(
        this.context.currentUser.id,
        'edit_admin_permission',
        'Permission IDs are required',
        'error'
      );
      throw new ValidationError('Permission IDs are required');
    }

    // Delete existing permissions for the admin
    await this.adminPermissionModel.deleteAdminPermission(admin_id);

    // Insert new permissions
    const result = await this.adminPermissionModel.insertAdminPermission(data);

    // Log the admin permission update
    await this.logAdminPermissionEvent(
      this.context.currentUser.id,
      'edit_admin_permission',
      `Admin permission updated with ID: ${admin_id}`,
      'info'
    );

    return result;
  }

  /**
   * Log admin permission event
   * @access private
   * @param user User ID
   * @param action Action
   * @param details Details
   * @param level Level
   */
  private async logAdminPermissionEvent(
    user: string,
    action: string,
    details: string,
    level: string
  ) {
    this.logService.insertLog({
      user: user,
      action: action,
      details: details,
      component: 'admin_permission',
      level: level,
    });
  }
}

export default AdminPermissionService;
