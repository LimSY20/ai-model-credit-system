import { Log, LogData } from "./models";
import LogModel from "./models";

class LogService {
  private context: any;
  private logModel: LogModel;

  constructor(context: any) {
    this.context = context;
    this.logModel = new LogModel(context);
  }

  /**
   * Get all logs
   * @returns Promise<LogData[]>
   */
  async getLogs(): Promise<Log[]> {
    const result = await this.logModel.getAllLogs();
    return result;
  }

  /**
   * Insert a new log
   * @param data Log data to insert
   * @returns Promise<LogData>
   */
  async insertLog(data: LogData): Promise<Log> {
    const { user, action, details, component, level } = data;
    if (!user || !action || !details || !component || !level)
      throw new Error('User, action, details, component, level are required');

    const result = await this.logModel.insertLog(data);
    return result;
  }
}

export default LogService;
