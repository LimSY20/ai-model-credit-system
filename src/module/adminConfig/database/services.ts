import { NotFoundError, ConflictError, ValidationError } from "../../../utils/helper.errors";
import { AdminConfig, AdminConfigData } from "./models";
import AdminConfigModel from "./models";
import LogService from "../../log/database/services";

class AdminConfigService {
  private context: any;
  private adminConfigModel: AdminConfigModel;
  private logService: LogService;

  constructor(context: any) {
    this.context = context;
    this.adminConfigModel = new AdminConfigModel(context);
    this.logService = new LogService(context);
  }

  /**
   * Get admin config
   * @returns Promise AdminConfig[]
   */
  async getAdminConfig(): Promise<AdminConfig[]> {
    const result = await this.adminConfigModel.getAllAdminConfig();

    await this.logAdminConfigEvent(
      this.context.currentUser.id,
      'get_admin_config',
      'Get admin config',
      'info'
    );

    if (!result) {
      throw new NotFoundError('No admin config found');
    }

    return result;
  }

  /**
   * Add admin config
   * @param data AdminConfig data
   * @returns Promise AdminConfig
   */
  async addAdminConfig(data: AdminConfigData): Promise<AdminConfig> {
    const { name, value, description, type } = data;
    // Check if name and value are provided
    if (!name || !value) {
      await this.logAdminConfigEvent(
        this.context.currentUser.id,
        'add_admin_config',
        'Name and value are required',
        'error'
      );
      throw new ValidationError('Name and value are required');
    }

    // Check if name already exists
    const existingConfig = await this.adminConfigModel.getAdminConfigByName(name);
    if (existingConfig) {
      await this.logAdminConfigEvent(
        this.context.currentUser.id,
        'add_admin_config',
        'Config with this name already exists',
        'error'
      );
      throw new ConflictError('Config with this name already exists');
    }

    const result = await this.adminConfigModel.insertAdminConfig(data);
    if (!result) {
      throw new Error('Failed to add admin config');
    }

    // Log the addition of admin config
    await this.logAdminConfigEvent(
      this.context.currentUser.id,
      'add_admin_config',
      `Added admin config: ${name}`,
      'info'
    );

    return result;
  }

  /**
   * Edit admin config
   * @param data AdminConfig data
   * @returns Promise AdminConfig
   */
  async editAdminConfig(data: AdminConfigData): Promise<AdminConfig> {
    const { name, value } = data;
    // Check if name and value are provided
    if (!name || !value) {
      await this.logAdminConfigEvent(
        this.context.currentUser.id,
        'edit_admin_config',
        'Name and value are required',
        'error'
      );
      throw new ValidationError('Name and value are required');
    }

    if (name.toLowerCase() === 'credit_mode') this.validateCreditMode(value);
    if (name.toLowerCase() === 'user_use_own_api_key') this.validateBoolean(value);

    const result = await this.adminConfigModel.updateAdminConfig(data);
    if (!result) {
      throw new Error('Failed to update admin config');
    }

    await this.logAdminConfigEvent(
      this.context.currentUser.id,
      'edit_admin_config',
      `Edited admin config: ${name}`,
      'info'
    );

    return result;
  }

  /**
   * Delete admin config
   * @param name Config name
   * @returns Promise<void>
   */
  async deleteAdminConfig(name: string): Promise<AdminConfig> {
    // Check if name is provided
    if (!name) {
      await this.logAdminConfigEvent(
        this.context.currentUser.id,
        'delete_admin_config',
        'Name is required',
        'error'
      );
      throw new ValidationError('Name is required');
    }

    const result = await this.adminConfigModel.deleteAdminConfig(name);
    if (!result) {
      throw new Error('Failed to delete admin config');
    }

    await this.logAdminConfigEvent(
      this.context.currentUser.id,
      'delete_admin_config',
      `Deleted admin config: ${name}`,
      'info'
    );

    return result;
  }

  /**
   * Validate credit mode
   * @access private
   * @param mode Credit mode - either 'balance' or 'total'
   * @returns boolean
   */
  private async validateCreditMode(mode: string): Promise<boolean> {
    if (!mode) {
      await this.logAdminConfigEvent(
        this.context.currentUser.id,
        'validate_credit_mode',
        'Mode is required',
        'error'
      );
      throw new ValidationError('Mode is required');
    }

    if (!['balance', 'total'].includes(mode.toLowerCase())) {
      await this.logAdminConfigEvent(
        this.context.currentUser.id,
        'validate_credit_mode',
        'Invalid mode. Must be either "balance" or "total"',
        'error'
      );
      throw new ValidationError('Invalid mode. Must be either "balance" or "total"');
    }

    return true;
  }

  /**
   * Validate boolean value
   * @access private
   * @param value Boolean value - either 'true' or 'false'
   * @returns boolean
   */
  private async validateBoolean(value: string): Promise<boolean> {
    if (!value) {
      await this.logAdminConfigEvent(
        this.context.currentUser.id,
        'validate_boolean',
        'Value is required',
        'error'
      );
      throw new ValidationError('Value is required');
    }

    if (!['true', 'false'].includes(value.toLowerCase())) {
      await this.logAdminConfigEvent(
        this.context.currentUser.id,
        'validate_boolean',
        'Invalid value. Must be either "true" or "false"',
        'error'
      );
      throw new ValidationError('Invalid value. Must be either "true" or "false"');
    }

    return true;
  }

  /**
   * Log admin config event
   * @access private
   * @param user User ID
   * @param action Action
   * @param details Details
   * @param level Level
   */
  private async logAdminConfigEvent(
    user: string,
    action: string,
    details: string,
    level: 'info' | 'warn' | 'error' = 'info'
  ) {
    await this.logService.insertLog({
      user,
      action,
      details,
      component: 'admin_config',
      level
    });
  }
}

export default AdminConfigService;
