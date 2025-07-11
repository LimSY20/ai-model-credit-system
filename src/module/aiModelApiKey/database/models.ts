import PostgresHelper from "../../../utils/helper.postgres";

export interface AiModel {
  model: string;
  apiKey: string;
}

export interface AiModelApiKey {
  id: number;
  model: string;
  api_key: string;
  added_by: number;
  created_at: Date;
}

class AiModelApiKeyModel {
  private context: any;
  private db = PostgresHelper.getInstance();

  constructor(context: any) {
    this.context = context;
  }

  /**
   * Get all API keys for the current user
   * @returns Promise<AiModelApiKey[]>
   */
  async getAllApiKeys(): Promise<AiModelApiKey[]> {
    const query = `SELECT * FROM ai_model_api_keys WHERE added_by = $1`;
    const result = await this.db.query(query, [this.context.currentUser.id]);
    return result.rows;
  }

  /**
   * Insert API key
   * @param data AiModel data
   * @returns Promise<AiModelApiKey>
   */
  async insertApiKey(data: AiModel): Promise<AiModelApiKey> {
    const query = `
      INSERT INTO ai_model_api_keys (model, api_key, added_by, created_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *`;
    const values = [
      data.model.toLowerCase(),
      data.apiKey,
      this.context.currentUser.id,
      new Date()
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  /**
   * Update API key
   * @param data AiModel data
   * @returns Promise<AiModelApiKey>
   */
  async updateApiKey(data: AiModel): Promise<AiModelApiKey> {
    const query = `
      UPDATE ai_model_api_keys
      SET api_key = $1
      WHERE model = $2 AND added_by = $3
      RETURNING *`;
    const values = [data.apiKey, data.model.toLowerCase(), this.context.currentUser.id];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete API key
   * @param model AI model
   * @returns Promise<AiModelApiKey>
   */
  async deleteApiKey(model: string): Promise<AiModelApiKey> {
    const query = `
      DELETE FROM ai_model_api_keys
      WHERE model = $1 AND added_by = $2
      RETURNING *`;
    const values = [model.toLowerCase(), this.context.currentUser.id];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  /**
   * Get model data by model name
   * @param model AI model
   * @returns Promise<AiModelApiKey[]>
   */
  async getModelDataByModel(model: string): Promise<AiModelApiKey[]> {
    const query = `SELECT * FROM ai_model_api_keys WHERE model = $1`;
    const result = await this.db.query(query, [model.toLowerCase()]);
    return result.rows;
  }
}

export default AiModelApiKeyModel;
