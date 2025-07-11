import { Pool, QueryResult, QueryResultRow } from 'pg';
import configs from '../configs';

class PostgresHelper {
  private static instance: PostgresHelper;
  private pool: Pool;

  private constructor() {
    this.pool = new Pool({
      user: configs.pg_user,
      host: configs.pg_host,
      database: configs.pg_database,
      password: configs.pg_password,
      port: Number(configs.pg_port),
    });
  }

  static getInstance(): PostgresHelper {
    if (!PostgresHelper.instance) {
      PostgresHelper.instance = new PostgresHelper();
    }
    return PostgresHelper.instance;
  }

  async query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export default PostgresHelper;
