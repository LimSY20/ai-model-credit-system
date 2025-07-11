import PostgresHelper from "../../../utils/helper.postgres";

export interface Admin {
  id: number;
  googleId?: string | null;
  name: string;
  email: string;
  password: string;
  user_type: string; // admin - 1, brand owner - 2
  mobile_number: string;
  country: string;
  date_created: Date | null;
  last_login: Date | null;
}

export interface ContextAdmin {
  id: number;
  name: string;
  email: string;
}

export interface CreateAdminData {
  name: string;
  email: string;
  password: string;
  user_type: string;
  mobile_number: string;
  country: string;
  permissions?: number[];
}

export interface UpdateAdminData {
  name?: string;
  email?: string;
  newPassword?: string;
  user_type?: string;
  mobile_number?: string;
  country?: string;
}

class AdminModel {
  private context: any;
  private db = PostgresHelper.getInstance();

  constructor(context: any) {
    this.context = context;
  }

  /**
   * Get admin by email
   * @param email Admin email
   * @returns Promise Admin
   */
  async getAdminByEmail(email: string): Promise<Admin> {
    const query = `SELECT * FROM admin WHERE email = $1`;
    const result = await this.db.query(query, [email]);
    return result.rows[0];
  }

  /**
   * Get admin by ID
   * @param id Admin ID
   * @returns Promise Admin
   */
  async getAdminById(id: string): Promise<Admin> {
    const query = `SELECT * FROM admin WHERE id = $1`;
    const result = await this.db.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Get admin by Google ID
   * @param googleId Admin Google ID
   * @returns 
   */
  async getAdminByGoogleId(googleId: string): Promise<Admin> {
    const query = `SELECT * FROM admin WHERE google_id = $1`;
    const result = await this.db.query(query, [googleId]);
    return result.rows[0];
  }

  /**
   * Insert admin
   * @param data CreateAdminData
   * @returns Promise<Admin>
   */
  async insertAdmin(data: Partial<CreateAdminData>): Promise<Admin> {
    const query = `
      INSERT INTO admin
      (name, email, password, user_type, mobile_number, country, date_created)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`;
    const values = [
      data.name,
      data.email?.toLowerCase(),
      data.password,
      data.user_type,
      data.mobile_number,
      data.country,
      new Date()
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  /**
   * Update admin last login
   * @param id Admin ID
   * @returns Promise Admin
   */
  async updateAdminLastLogin(id: number): Promise<Admin> {
    const query = `
      UPDATE admin
      SET last_login = $1
      WHERE id = $2
      RETURNING *`;
    const result = await this.db.query(query, [new Date(), id]);
    return result.rows[0];
  }

  /**
   * Update admin profile with password
   * @param id Admin ID
   * @param data Admin data to update
   * @param hashedPassword Hashed password
   * @returns Promise Admin
   */
  async updateAdminProfileWithPassword(id: string, data: Partial<UpdateAdminData>): Promise<Admin> {
    const { name, email, newPassword, mobile_number, country } = data;
    const query = `
      UPDATE admin
      SET name = $1, email = $2, password = $3, mobile_number = $4, country = $5
      WHERE id = $6
      RETURNING *`;
    const values = [name, email, newPassword, mobile_number, country, id];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  /**
   * Update admin profile
   * @param id Admin ID
   * @param data Admin data to update
   * @returns Promise Admin
   */
  async updateAdminProfile(id: string, data: Partial<UpdateAdminData>): Promise<Admin> {
    const { name, email, mobile_number, country } = data;
    const query = `
      UPDATE admin
      SET name = $1, email = $2, mobile_number = $3, country = $4
      WHERE id = $5
      RETURNING *`;
    const values = [name, email, mobile_number, country, id];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  /**
   * Update admin google id
   * @param email Admin email
   * @param googleId Google ID
   * @returns Promise Admin
   */
  async updateAdminGoogleId(email: string, googleId: string): Promise<Admin> {
    const query = `
      UPDATE admin
      SET google_id = $1
      WHERE email = $2
      RETURNING *`;
    const values = [googleId, email.toLowerCase()];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }
}

export default AdminModel;
