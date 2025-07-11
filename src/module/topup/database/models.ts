import PostgresHelper from "../../../utils/helper.postgres";

export interface TopUpPlan {
  id?: number;
  name: string;
  cost: number;
  credits: number;
}

class TopUpModel {
  private context: any;
  private db = PostgresHelper.getInstance();

  constructor(context: any) {
    this.context = context;
  }

  async getAllTopUpPlans(): Promise<TopUpPlan[]> {
    const query = `SELECT * FROM top_up_plans`;
    const result = await this.db.query(query);
    return result.rows;
  }
}

export default TopUpModel;
