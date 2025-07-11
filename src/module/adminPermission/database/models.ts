import PostgresHelper from "../../../utils/helper.postgres";

export interface Permission {
  id: number;
  permission: string[];
}

export interface PermissionData {
  permission_id: number;
  permission: string;
}

export interface AdminPermissionData {
  admin_id: number;
  permissionIds: number[];
}

export interface AdminPermission {
  id: number;
  admin_id: number;
  permission_id: number;
}

export interface PermissionAndAdminPermission {
  id: number;
  admin_id: number;
  permission_id: number;
  permission: string;
  added_by: number;
  created_at: Date;
}

class AdminPermissionModel {
  private context: any;
  private db = PostgresHelper.getInstance();

  constructor(context: any) {
    this.context = context;
  }

  /**
   * Get permissions
   * @returns Promise Permission[]
   */
  async getAllPermissions(): Promise<Permission[]> {
    const query = `
      SELECT * FROM permissions`;
    const result = await this.db.query(query);
    return result.rows;
  }

  /**
   * Edit permission
   * @param data Permission data
   * @returns Promise Permission
   */
  async updatePermission(data: PermissionData): Promise<Permission[]> {
    const { permission_id, permission } = data;
    const query = `
      UPDATE permissions
      SET permission = $1
      WHERE id = $2
      RETURNING *`;
    const values = [permission, permission_id];
    const result = await this.db.query(query, values);
    return result.rows;
  }

  /**
   * Insert admin permission
   * @param data AdminPermissionData
   * @returns Promise<AdminPermission[]>
   */
  async insertAdminPermission(data: AdminPermissionData): Promise<AdminPermission[]> {
    const { admin_id, permissionIds } = data;
    const insertQuery = `
      INSERT INTO admin_permissions (admin_id, permission_id)
      VALUES ${permissionIds.map((_, index) => `($1, $${index + 2})`).join(', ')}
      RETURNING *`;
    const values = [admin_id, ...permissionIds];
    const result = await this.db.query(insertQuery, values);

    return result.rows;
  }

  /**
   * Delete admin permissions by admin ID
   * @param admin_id Admin ID to delete permissions for
   * @returns Promise<AdminPermission[]>
   */
  async deleteAdminPermission(admin_id: number): Promise<AdminPermission[]> {
    const query = `
      DELETE FROM admin_permissions
      WHERE admin_id = $1
      RETURNING *`;
    const values = [admin_id];
    const result = await this.db.query(query, values);
    return result.rows;
  }

  /**
   * Get admin permissions and their associated permissions
   * @returns Promise<PermissionAndAdminPermission[]>
   */
  async getPermissionAndAdminPermissions(): Promise<PermissionAndAdminPermission[]> {
    const query = `
      SELECT ap.id, ap.admin_id, ap.permission_id,
              p.permission, p.added_by, p.created_at
      FROM admin_permissions ap
      JOIN permissions p ON ap.permission_id = p.id
      ORDER BY ap.admin_id`;
    const result = await this.db.query(query);
    return result.rows;
  }

  /**
   * Get admin permissions by admin ID
   * @param id Admin ID
   * @returns Promise Permission[]
   */
  async getAdminPermissionById(id: number): Promise<Permission[]> {
    const query = `
      SELECT *
      FROM admin_permissions
      WHERE admin_id = $1`;
    const result = await this.db.query(query, [id]);
    return result.rows;
  }
}

export default AdminPermissionModel;
