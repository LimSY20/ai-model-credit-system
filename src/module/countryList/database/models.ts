import PostgresHelper from "../../../utils/helper.postgres";

export interface CountryBlackList {
  id: number;
  country_name: string;
  added_by: number;
  created_at: Date;
}

export interface CountryBlackListData {
  id: number;
  country_name: string;
}

class CountryListModel {
  private context: any;
  private db = PostgresHelper.getInstance();

  constructor(context: any) {
    this.context = context;
  }

  /**
   * Get all black list country
   * @returns Promise CountryBlackList[]
   */
  async getAllBlackListCountry(): Promise<CountryBlackList[]> {
    const query = `SELECT * FROM blacklist_country`;
    const result = await this.db.query(query);
    return result.rows;
  }

  /**
   * Insert black list country
   * @param country_name Country name
   * @returns Promise CountryBlackList
   */
  async insertBlackListCountry(country_name: string): Promise<CountryBlackList> {
    const query = `
      INSERT INTO blacklist_country (country_name, added_by, created_at)
      VALUES ($1, $2, $3)
      RETURNING *`;
    const result = await this.db.query(query, [country_name.toLowerCase(), this.context.currentUser.id, new Date()]);
    return result.rows[0];
  }

  /**
   * Update black list country
   * @param data CountryBlackList data
   * @returns Promise CountryBlackList
   */
  async updateBlackListCountry(data: CountryBlackListData): Promise<CountryBlackList> {
    const { id, country_name } = data;
    const query = `
      UPDATE blacklist_country
      SET country_name = $1
      WHERE id = $2 AND added_by = $3
      RETURNING *`;
    const values = [country_name.toLowerCase(), id, this.context.currentUser.id];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete black list country
   * @param country_name Country name
   * @returns Promise CountryBlackList
   */
  async deleteBlackListCountry(country_name: string): Promise<CountryBlackList> {
    const query = `
      DELETE FROM blacklist_country
      WHERE country_name = $1 AND added_by = $2
      RETURNING *`;
    const values = [country_name.toLowerCase(), this.context.currentUser.id];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }
}

export default CountryListModel;
