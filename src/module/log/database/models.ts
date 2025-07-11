import PostgresHelper from "../../../utils/helper.postgres";

export interface Log {
  id: number;
  user: string;
  action: string;
  details?: string;
  component?: string;
  level: string;
  date: Date;
}

export interface LogData {
  user: string;
  action: string;
  details?: string;
  component?: string;
  level: string;
}

class LogModel {
  private context: any;
  private db = PostgresHelper.getInstance();

  constructor(context: any) {
    this.context = context;
  }

  /**
   * Get all logs
   * @returns Promise<Log[]>
   */
  async getAllLogs(): Promise<Log[]> {
    const query = `SELECT * FROM logs`;
    const result = await this.db.query(query);
    return result.rows;
  }

  /**
   * Insert a new log
   * @param data Log data to insert
   * @returns Promise<Log>
   */
  async insertLog(data: LogData): Promise<Log> {
    const { user, action, details, component, level } = data;
    const query = `
      INSERT INTO logs("user", action, details, component, level, date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`;
    const values = [
      user,
      action,
      details,
      component,
      level,
      new Date()
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }
}

export default LogModel;
