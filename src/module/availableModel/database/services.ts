import { NotFoundError, ValidationError } from "../../../utils/helper.errors";
import { UserAvailableModels, AvailableModelData, AvailableModel } from "./models";
import AdminApiKeyService from "../../aiModelApiKey/database/services";
import AvailableModelModel from "./models";
import SubscriptionModel from "../../subscriptions/database/models";
import LogService from "../../log/database/services";

class AvailableModelService {
  private context: any;
  private adminApiKeyService: AdminApiKeyService | null = null;
  private availableModelModel: AvailableModelModel;
  private subscriptionModel: SubscriptionModel;
  private logService: LogService;

  constructor(context: any, services?: {
    adminApiKeyService?: AdminApiKeyService;
    availableModelModel?: AvailableModelModel;
    subscriptionModel?: SubscriptionModel;
    logService?: LogService;
  }) {
    this.context = context;
    this.availableModelModel = services?.availableModelModel || new AvailableModelModel(context);
    this.subscriptionModel = services?.subscriptionModel || new SubscriptionModel(context);
    this.logService = services?.logService || new LogService(context);
  }

  private getAdminApiKeyService(): AdminApiKeyService {
    if (!this.adminApiKeyService) {
      this.adminApiKeyService = new AdminApiKeyService(this.context, {
        availableModelService: this
      })
    }
    return this.adminApiKeyService;
  }

  /**
   * Get user available models by id
   * @returns Promise UserAvailableModels[]
   */
  async getAvailableModels(): Promise<UserAvailableModels[]> {
    const result = await this.availableModelModel.getAvailableModelsById();

    await this.logService.insertLog({
      user: this.context.currentUser.id,
      action: 'get_available_models',
      details: `User with ID: ${this.context.currentUser.id} get available models`,
      component: 'user',
      level: 'info'
    });

    if (!result)
      throw new NotFoundError('No available models found');
    return result;
  }

  /**
   * Get all available models added by admin
   * @returns Promise<AvailableModel[]>
   */
  async getAllAvailableModels(): Promise<AvailableModel[]> {
    const result = await this.availableModelModel.getAllAvailableModels();

    await this.logService.insertLog({
      user: this.context.currentUser.id,
      action: 'get_all_available_models',
      details: `User with ID: ${this.context.currentUser.id} get all available models`,
      component: 'user',
      level: 'info'
    });

    if (!result) {
      throw new NotFoundError('No available models found');
    }
    return result;
  }

  /**
   * Add available model - e.g. gpt4o
   * @param data Partial<AvailableModelData>
   * @returns Promise<AvailableModel>
   */
  async addAvailableModel(data: Partial<AvailableModelData>): Promise<AvailableModel> {
    const id = this.context.currentUser.id;
    const { model, name, account_type, cost } = data;

    // Check if model, apiKey, account_type, and cost are provided
    if (!model || !name || !account_type || !cost) {
      await this.logAvailableModelEvent(
        id,
        'Missing required fields',
        'Model, name, account type, and cost are required',
        'error'
      );
      throw new ValidationError('Model, name, account type, and cost are required');
    }

    // Validate temperature
    let temperature = data.temperature;
    if (temperature && (temperature < 0 || temperature > 2)) {
      await this.logAvailableModelEvent(
        id,
        'Invalid temperature',
        'Temperature must be between 0 and 2',
        'error'
      );
      throw new ValidationError('Temperature must be between 0 and 2');
    }

    // Set default temperature if not provided
    if (!temperature)
      temperature = 0.7;

    // Get model id using model name
    const modelIdResult = await this.getAdminApiKeyService().getModelDataByModel(model.toLowerCase());
    if (modelIdResult.length === 0)
      throw new NotFoundError('Model not found');

    // Get subscription data using subscription name
    const subscription = await this.subscriptionModel.getSubscriptionByName(account_type.toLowerCase());
    if (!subscription)
      throw new NotFoundError('Subscription not found');

    // Insert available model
    const result = await this.availableModelModel.insertAvailableModel({
      model: model.toLowerCase(),
      name,
      cost,
      temperature,
      subscription_id: Number(subscription.id),
      model_id: modelIdResult[0].id,
      added_by: id,
      created_at: new Date()
    });
    if (!result) {
      throw new Error('Failed to add available model');
    }

    // Insert log
    await this.logService.insertLog({
      user: id,
      action: 'add_available_model',
      details: `Admin with ID: ${id} added available model: ${name} by ${model}`,
      component: 'admin',
      level: 'info'
    });
    
    return result;
  }

  /**
   * Edit available model
   * @param data Partial<AvailableModelData>
   * @returns Promise<AvailableModel>
   */
  async editAvailableModel(data: Partial<AvailableModelData>): Promise<AvailableModel> {
    const id = this.context.currentUser.id;
    const { name, account_type, cost } = data;
    // Check if id, name, account_type, and cost are provided
    if (!name || !account_type || !cost) {
      await this.logAvailableModelEvent(
        id,
        'Missing required fields',
        'Name, account type, and cost are required',
        'error'
      );
      throw new ValidationError('Name, account type, and cost are required');
    }

    // Validate temperature
    let temperature = data.temperature;
    if (temperature && (temperature < 0 || temperature > 2)) {
      await this.logAvailableModelEvent(
        id,
        'Invalid temperature',
        'Temperature must be between 0 and 2',
        'error'
      );
      throw new ValidationError('Temperature must be between 0 and 2');
    }

    // Set default temperature if not provided
    if (!temperature)
      temperature = 0.7;

    // Get subscription data using subscription name
    const subscription = 
      await this.subscriptionModel.getSubscriptionByName(account_type.toLowerCase());
    
    if (!subscription)
      throw new NotFoundError('Subscription not found');

    // Update available model
    const result_update = await this.availableModelModel.updateAvailableModel({
      name,
      cost,
      temperature,
      subscription_id: Number(subscription.id),
      id
    });

    // Insert log
    const admin_id = this.context.currentUser.id;
    await this.logService.insertLog({
      user: admin_id,
      action: 'edit_available_model',
      details: `Admin with ID: ${admin_id} edited available model: ${name}`,
      component: 'admin',
      level: 'info'
    });

    return result_update;
  }

  /**
   * Delete available model
   * @param name Model name
   * @returns Promise<AvailableModel>
   */
  async deleteAvailableModel(name: string): Promise<AvailableModel> {
    const id = this.context.currentUser.id;
    // Check if name is provided
    if (!name) {
      await this.logAvailableModelEvent(
        id,
        'Missing required fields',
        'Model name is required',
        'error'
      );
      throw new ValidationError('Model name is required');
    }

    // Delete available model
    const result = await this.availableModelModel.deleteAvailableModel(name);
    if (!result) {
      throw new Error('Failed to delete model');
    }

    // Insert log
    const admin_id = this.context.currentUser.id;
    await this.logService.insertLog({
      user: admin_id,
      action: 'delete_available_model',
      details: `Admin with ID: ${admin_id} deleted available model: ${name}`,
      component: 'admin',
      level: 'info'
    });

    return result;
  }

  /**
   * Log available model event
   * @param user User ID
   * @param action Action
   * @param details Details
   * @param level Level
   */
  private async logAvailableModelEvent(
    user: string,
    action: string,
    details: string,
    level: string
  ) {
    await this.logService.insertLog({
      user,
      action,
      details,
      component: 'add available model',
      level
    });
  }
}

export default AvailableModelService;
