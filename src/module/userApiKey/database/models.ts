import PostgresHelper from "../../../utils/helper.postgres";

export interface UserApiKey {
  id: number,
  userId: number,
  model: string,
  api_key: string,
  date_created: Date,
}

export interface AddApiKey {
  model: string,
  apiKey: string,
}

class UserApiKeyModel {
  private context: any;
  private db = PostgresHelper.getInstance();

  constructor(context: any) {
    this.context = context;
  }

  /**
   * Get all API keys for the current user
   * @returns Promise<UserApiKey[]>
   */
  async getAllApiKeysData(): Promise<UserApiKey[]> {
    const query = `SELECT * FROM user_api_keys WHERE user_id = $1`;
    const result = await this.db.query(query, [this.context.currentUser.id]);
    return result.rows;
  }

  /**
   * Insert API key
   * @param data API key data
   * @returns Promise<UserApiKey>
   */
  async insertApiKey(data: AddApiKey): Promise<UserApiKey> {
    const { model, apiKey } = data;
    const query = `
      INSERT INTO user_api_keys (user_id, model, api_key, date_created)
      VALUES ($1, $2, $3, $4)
      RETURNING *`;
    const values = [
      this.context.currentUser.id,
      model.toLowerCase(),
      apiKey,
      new Date()
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  /**
   * Update API key
   * @param data API key data
   * @returns Promise<UserApiKey>
   */
  async updateApiKey(data: AddApiKey): Promise<UserApiKey> {
    const { model, apiKey } = data;
    const query = `
      UPDATE user_api_keys
      SET api_key = $1
      WHERE model = $2 AND user_id = $3
      RETURNING *`;
    const values = [apiKey, model, this.context.currentUser.id];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete API key
   * @param model Model name
   * @returns Promise<UserApiKey>
   */
  async deleteApiKey(model: string): Promise<UserApiKey> {
    const query = `
      DELETE FROM user_api_keys
      WHERE model = $1 AND user_id = $2
      RETURNING *`;
    const values = [model.toLowerCase(), this.context.currentUser.id];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  /**
   * Get API key by user ID and model
   * @param id User ID
   * @param model Model name - e.g. 'openai'
   * @returns Api Key
   */
  async getApiKeyByIdAndModel(id: string, model: string): Promise<UserApiKey[]> {
    const query = `SELECT * FROM user_api_keys WHERE user_id = $1 AND model = $2`;
    const result = await this.db.query(query, [id, model.toLowerCase()]);
    return result.rows;
  }
}

export default UserApiKeyModel;
