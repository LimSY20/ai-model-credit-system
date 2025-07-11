import PostgresHelper from "../../../utils/helper.postgres";

export interface UserAvailableModels {
  model: string,
  name: string,
  cost: number,
  subscription: string,
}

export interface AvailableModelData {
  id?: number;
  model: string;
  name: string;
  cost: number;
  temperature: number;
  account_type?: string;
  subscription_id?: number;
  model_id: number;
  added_by: number;
  created_at: Date;
}

export interface AvailableModel {
  id: number;
  model: string;
  name: string;
  cost: number;
  temperature: number;
  subscription_id: number;
  model_id: number;
  added_by: number;
  created_at: Date;
}

class AvailableModelModel {
  private context: any;
  private db = PostgresHelper.getInstance();

  constructor(context: any) {
    this.context = context;
  }

  /**
   * Get available models by user ID
   * @description User view available based on their subscriptions
   * @returns Promise<UserAvailableModels[]>
   */
  async getAvailableModelsById(): Promise<UserAvailableModels[]> {
    const query = `
      SELECT am.model, am.name as name, am.cost, s.name as subscription
      FROM accounts a
      JOIN subscriptions s ON a.subscription_id = s.id
      JOIN available_models am ON am.subscription_id = s.id
      WHERE a.user_id = $1`;
    const result = await this.db.query(query, [this.context.currentUser.id]);
    return result.rows;
  }

  /**
   * Get all available models
   * @returns Promise<AvailableModel[]>
   */
  async getAllAvailableModels(): Promise<AvailableModel[]> {
    const query = `SELECT * FROM available_models`;
    const result = await this.db.query(query);
    return result.rows;
  }

  /**
   * Insert available model
   * @param data Available model data
   * @returns Promise<AvailableModel>
   */
  async insertAvailableModel(data: AvailableModelData): Promise<AvailableModel> {
    const { model, name, cost, temperature, subscription_id, model_id, added_by, created_at } = data;
    const query = `
      INSERT INTO available_models (model, name, cost, temperature, subscription_id, model_id, added_by, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`;
    const values = [
      model.toLowerCase(),
      name,
      cost,
      temperature,
      subscription_id,
      model_id,
      added_by,
      new Date()
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  /**
   * Update available model
   * @param data Available model data
   * @returns Promise<AvailableModel>
   */
  async updateAvailableModel(data: Partial<AvailableModelData>): Promise<AvailableModel> {
    const query = `
      UPDATE available_models
      SET name = $1, cost = $2, temperature = $3, subscription_id = $4
      WHERE id = $5
      RETURNING *`;
    const values = [data.name, data.cost, data.temperature, data.subscription_id, data.id];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete available model
   * @param name Available model name
   * @returns Promise<AvailableModel>
   */
  async deleteAvailableModel(name: string): Promise<AvailableModel> {
    const query = `
      DELETE FROM available_models
      WHERE name = $1 AND added_by = $2
      RETURNING *`
    const result = await this.db.query(query, [name, this.context.currentUser.id]);
    return result.rows[0];
  }

  /**
   * Get available model by admin ID
   * @param model AI model name
   * @param id Admin ID
   * @returns 
   */
  async getAvailableModelByUser(model: string, id: string): Promise<AvailableModel[]> {
    const query = `
      SELECT * FROM available_models
      WHERE model = $1 AND added_by = $2`;
    const values = [model, id];
    const result = await this.db.query(query, values);
    return result.rows;
  }

  /**
   * Get available models API key by model and name
   * @param model Model name - e.g. 'openai'
   * @param name Model name - e.g. 'gpt-3.5-turbo'
   * @returns Available models API key
   */
  async getAvailableModelsApiKeyByModel(model: string, name: string) {
    // Get available models API key
    const query = `
      SELECT a.model, a.name, k.api_key
      FROM available_models a
      JOIN ai_model_api_keys k ON a.model_id = k.id
      WHERE a.model = $1 AND a.name = $2`;
    const values = [model.toLowerCase(), name];
    const result = await this.db.query(query, values);
    return result.rows[0] || null;
  }
}

export default AvailableModelModel;
