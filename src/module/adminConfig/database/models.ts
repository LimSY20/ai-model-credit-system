import PostgresHelper from "../../../utils/helper.postgres";

export interface AdminConfigData {
  name: string;
  value: string;
  description?: string;
  type?: string;
}

export interface AdminConfig {
  id: number;
  name: string;
  value: string;
  description: string;
  type: string;
  added_by: number;
  created_at: Date;
}

class AdminConfigModel {
  private context: any;
  private db = PostgresHelper.getInstance();

  constructor(context: any) {
    this.context = context;
  }

  /**
   * Get admin config
   * @returns Promise AdminConfig[]
   */
  async getAllAdminConfig(): Promise<AdminConfig[]> {
    const query = `SELECT * FROM admin_config ORDER BY id`;
    const result = await this.db.query(query);
    return result.rows;
  }

  /**
   * Add admin config
   * @param data AdminConfig data
   * @returns Promise AdminConfig
   */
  async insertAdminConfig(data: AdminConfigData): Promise<AdminConfig> {
    const { name, value, description, type } = data;
    const query = `
      INSERT INTO admin_config (name, value, description, type, added_by, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`;
    const values = [
      name.toLowerCase(),
      value.toLowerCase(),
      description,
      type,
      this.context.currentUser.id,
      new Date()
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  /**
   * Update admin config
   * @param data AdminConfig data
   * @returns Promise AdminConfig
   */
  async updateAdminConfig(data: AdminConfigData): Promise<AdminConfig> {
    const { name, value, description, type } = data;
    const query = `
      UPDATE admin_config
      SET value = $1, description = $2, type = $3
      WHERE name = $4 AND added_by = $5
      RETURNING *`;
    const values = [
      value.toLowerCase(),
      description,
      type,
      name.toLowerCase(),
      this.context.currentUser.id
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete admin config
   * @param name Config name
   * @returns Promise AdminConfig
   */
  async deleteAdminConfig(name: string): Promise<AdminConfig> {
    const query = `
      DELETE FROM admin_config
      WHERE name = $1 AND added_by = $2
      RETURNING *`;
    const values = [name.toLowerCase(), this.context.currentUser.id];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  /**
   * Get admin config by name
   * @param name Config name
   * @returns Promise AdminConfig
   */
  async getAdminConfigByName(name: string): Promise<AdminConfig> {
    const query = `SELECT * FROM admin_config WHERE name = $1`;
    const result = await this.db.query(query, [name.toLowerCase()]);
    return result.rows[0];
  }
}

export default AdminConfigModel;
