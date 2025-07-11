import PostgresHelper from "../../../utils/helper.postgres";

export interface Subscription {
  id: number;
  name: string;
  monthly_cost: number;
  annual_cost: number;
  monthly_credit: number;
  added_by: number;
  created_at: Date;
}

export interface SubscriptionData {
  id?: number;
  name: string;
  monthly_cost: number;
  annual_cost: number;
  monthly_credit: number;
}

class SubscriptionModel {
  private context: any;
  private db = PostgresHelper.getInstance();

  constructor(context: any) {
    this.context = context;
  }

  /**
   * Get all subscriptions
   * @returns Promise Subscription[]
   */
  async getAllSubscriptions(): Promise<Subscription[]> {
    const query = `SELECT * FROM subscriptions`;
    const result = await this.db.query(query);
    return result.rows;
  }

  /**
   * Insert subscription
   * @param data Subscription data
   * @returns Promise Subscription
   */
  async insertSubscription(data: SubscriptionData): Promise<Subscription> {
    const { name, monthly_cost, annual_cost, monthly_credit } = data;
    const query = `
      INSERT INTO subscriptions (
        name,
        monthly_cost,
        annual_cost,
        monthly_credit,
        added_by,
        created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`;
    const values = [
      name.toLowerCase(),
      monthly_cost,
      annual_cost,
      monthly_credit,
      this.context.currentUser.id,
      new Date()
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  /**
   * Update subscription
   * @param data Subscription data
   * @returns Promise Subscription
   */
  async updateSubscription(data: SubscriptionData): Promise<Subscription> {
    const { id, name, monthly_cost, annual_cost, monthly_credit } = data;
    const query = `
      UPDATE subscriptions
      SET name = $1, monthly_cost = $2, annual_cost = $3, monthly_credit = $4
      WHERE id = $5
      RETURNING *`;
    const values = [name.toLowerCase(), monthly_cost, annual_cost, monthly_credit, id];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete subscription
   * @param id Subscription ID
   * @returns Promise Subscription
   */
  async deleteSubscription(id: string): Promise<Subscription> {
    const query = `DELETE FROM subscriptions WHERE id = $1`;
    const result = await this.db.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Get subscription by ID
   * @param id Subscription ID
   * @returns Promise Subscription
   */
  async getSubscriptionById(id: number): Promise<Subscription> {
    const query = `SELECT * FROM subscriptions WHERE id = $1`;
    const result = await this.db.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Get subscription by name
   * @param name Subscription name
   * @returns Promise Subscription
   */
  async getSubscriptionByName(name: string): Promise<Subscription> {
    const query = `SELECT * FROM subscriptions WHERE name = $1`;
    const result = await this.db.query(query, [name]);
    return result.rows[0];
  }
}

export default SubscriptionModel;
