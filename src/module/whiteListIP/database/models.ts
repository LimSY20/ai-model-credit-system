import PostgresHelper from "../../../utils/helper.postgres";

export interface IPWhiteList {
  id: number;
  ip_address: string;
  added_by: number;
  created_at: Date;
  last_login: Date | null;
}

class WhiteListIPModel {
  private context: any;
  private db = PostgresHelper.getInstance();

  constructor(context: any) {
    this.context = context;
  }

  /**
   * Get all white list IP
   * @returns Promise IPWhiteList[]
   */
  async getAllWhiteListIP(): Promise<IPWhiteList[]> {
    const query = `SELECT * FROM whitelist_ip`;
    const result = await this.db.query(query);
    return result.rows;
  }

  /**
   * Insert white list IP
   * @param ip_address IP address
   * @returns Promise IPWhiteList
   */
  async insertWhiteListIP(ip_address: string): Promise<IPWhiteList> {
    const query = `
      INSERT INTO whitelist_ip (ip_address, added_by, created_at)
      VALUES ($1, $2, $3)
      RETURNING *`;
    const values = [
      ip_address,
      this.context.currentUser.id,
      new Date()
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  /**
   * Update white list IP
   * @param ip_address IP address
   * @returns Promise IPWhiteList
   */
  async updateWhiteListIP(ip_address: string): Promise<IPWhiteList> {
    const query = `
      UPDATE whitelist_ip
      SET ip_address = $1
      WHERE ip_address = $2
      RETURNING *`;
    const values = [ip_address, this.context.currentUser.id];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete white list IP
   * @param id IP address ID
   * @returns Promise IPWhiteList
   */
  async deleteWhiteListIP(id: string): Promise<IPWhiteList> {
    const query = `
      DELETE FROM whitelist_ip
      WHERE id = $1
      RETURNING *`;
    const values = [id];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  /**
   * Get IP whitelist by IP address
   * @param ip_address IP address to check in whitelist
   * @returns Promise IPWhiteList
   */
  async getWhiteListIPByIP(ip_address: string): Promise<IPWhiteList> {
    const query = `SELECT * FROM whitelist_ip WHERE ip_address = $1`;
    const result = await this.db.query(query, [ip_address]);
    return result.rows[0];
  }

  /**
   * Update IP login
   * @param ip_address IP address
   * @returns Promise IPWhiteList
   */
  async updateIPLogin(ip_address: string): Promise<IPWhiteList> {
    const query = `
      UPDATE whitelist_ip
      SET last_login = $1
      WHERE ip_address = $2
      RETURNING *`;
    const result = await this.db.query(query, [new Date(), ip_address]);
    return result.rows[0];
  }
}

export default WhiteListIPModel;
