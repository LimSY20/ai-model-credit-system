import { ConflictError, ValidationError } from "../../../utils/helper.errors";
import { IPWhiteList } from "./models";
import WhiteListIPModel from "./models";
import LogService from "../../log/database/services";

class WhiteListIPService {
  private context: any
  private whiteListIPModel: WhiteListIPModel;
  private logService: LogService;

  constructor(context: any) {
    this.context = context;
    this.whiteListIPModel = new WhiteListIPModel(context);
    this.logService = new LogService(context);
  }

  /**
   * Get white list IP
   * @returns Promise IPWhiteList[]
   */
  async getWhiteListIP(): Promise<IPWhiteList[]> {
    const result = await this.whiteListIPModel.getAllWhiteListIP();

    let user_id = 'anonymous';
    if (this.context !== null)
      user_id = this.context.currentUser.id;

    await this.logWhiteListIPEvent(
      user_id,
      'get-white-list-ip',
      'Get white list IP',
      'info'
    );

    if (!result) {
      throw new Error('No white list IP found');
    }
    return result;
  }

  /**
   * Add white list IP
   * @param id Admin ID
   * @param ip_address IP address
   * @returns Promise IPWhiteList
   */
  async addWhiteListIP(id: string, ip_address: string): Promise<IPWhiteList> {
    // Check if IP address is provided
    if (!ip_address) {
      await this.logWhiteListIPEvent(
        this.context.currentUser.id,
        'Missing required fields',
        'IP address is required',
        'error'
      );
      throw new ValidationError('IP address is required');
    }

    // Check if IP address already exists
    const existingIp = await this.whiteListIPModel.getWhiteListIPByIP(ip_address);
    if (existingIp) {
      await this.logWhiteListIPEvent(
        this.context.currentUser.id,
        'add-white-list-ip',
        'IP address already exists',
        'error'
      );
      throw new ConflictError('IP address already exists');
    }

    const result = await this.whiteListIPModel.insertWhiteListIP(ip_address);
    if (!result) {
      throw new Error('Failed to add IP address');
    }

    await this.logWhiteListIPEvent(
      this.context.currentUser.id,
      'add-white-list-ip',
      `Added IP address: ${ip_address}`,
      'info'
    );

    return result;
  }

  /**
   * Edit white list IP
   * @param data Partial IPWhiteList data
   * @returns Promise IPWhiteList
   */
  async editWhiteListIP(data: Partial<IPWhiteList>): Promise<IPWhiteList> {
    const { id, ip_address } = data;
    // Check if IP address is provided
    if (!id || !ip_address) {
      await this.logWhiteListIPEvent(
        this.context.currentUser.id,
        'Missing required fields',
        'ID and IP address are required',
        'error'
      );
      throw new ValidationError('ID and IP address are required');
    }

    // Check if IP address already exists
    const existingIp = await this.whiteListIPModel.getWhiteListIPByIP(ip_address);
    if (existingIp) {
      await this.logWhiteListIPEvent(
        this.context.currentUser.id,
        'edit-white-list-ip',
        'IP address already exists',
        'error'
      );
      throw new ConflictError('IP address already exists');
    }

    const result = await this.whiteListIPModel.updateWhiteListIP(ip_address);
    if (!result) {
      throw new Error('Failed to update IP address');
    }

    await this.logWhiteListIPEvent(
      this.context.currentUser.id,
      'edit-white-list-ip',
      `Edited IP address: ${ip_address}`,
      'info'
    );
    return result;
  }

  /**
   * Delete white list IP
   * @param id IP address
   * @returns Promise IPWhiteList
   */
  async deleteWhiteListIP(id: string): Promise<IPWhiteList> {
    // Check if IP address is provided
    if (!id) {
      await this.logWhiteListIPEvent(
        this.context.currentUser.id,
        'Missing required fields',
        'ID is required',
        'error'
      );
      throw new ValidationError('ID is required');
    }

    const result = await this.whiteListIPModel.deleteWhiteListIP(id);
    if (!result) {
      throw new Error('Failed to delete IP address');
    }

    await this.logWhiteListIPEvent(
      this.context.currentUser.id,
      'delete-white-list-ip',
      `Deleted IP address: ${id}`,
      'info'
    );
    return result;
  }

  /**
   * Log white list IP event
   * @access private
   * @param user User ID
   * @param action Action
   * @param details Details
   * @param level Level
   */
  private async logWhiteListIPEvent(
    user: string,
    action: string,
    details: string,
    level: string
  ) {
    await this.logService.insertLog({
      user: user,
      action: action,
      details: details,
      component: 'whiteListIP',
      level: level
    });
  }
}

export default WhiteListIPService;
