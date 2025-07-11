import { NotFoundError, ValidationError } from "../../../utils/helper.errors";
import { AiModelApiKey, AiModel } from "./models";
import AiModelApiKeyModel from "./models";
import UserApiKeyService from "../../userApiKey/database/services";
import AvailableModelService from "../../availableModel/database/services";
import AvailableModelModel from "../../availableModel/database/models";
import LogService from "../../log/database/services";

class AiModelApiKeyService {
  private context: any;
  private aiModelApiKeyModel: AiModelApiKeyModel;
  private userApiKeyService: UserApiKeyService;
  private availableModelService: AvailableModelService | null = null;
  private availableModelModel: AvailableModelModel;
  private logService: LogService;

  constructor(context: any, services?: {
    userApiKeyService?: UserApiKeyService;
    availableModelService?: AvailableModelService;
    availableModelModel?: AvailableModelModel;
    logService?: LogService;
  }) {
    this.context = context;
    this.aiModelApiKeyModel = new AiModelApiKeyModel(context);
    this.userApiKeyService = services?.userApiKeyService || new UserApiKeyService(context);
    this.availableModelModel = services?.availableModelModel || new AvailableModelModel(context);
    this.logService = services?.logService || new LogService(context);
  }

  private getAvailableModelService(): AvailableModelService {
    if (!this.availableModelService) {
      this.availableModelService = new AvailableModelService(this.context, {
        adminApiKeyService: this
      });
    }
    return this.availableModelService;
  }

  /**
   * View all API keys
   * @returns Promise AiModelApiKey[]
   */
  async getAllApiKeys(): Promise<AiModelApiKey[]> {
    const result = await this.aiModelApiKeyModel.getAllApiKeys();

    await this.logAiModelApiKeyEvent(
      this.context.currentUser.id,
      'get-all-api-keys',
      `Get all API keys`,
      'info'
    );

    if (!result) {
      throw new NotFoundError('No API keys found');
    }
    return result;
  }

  /**
   * Add API key
   * @param data AiModel data
   * @returns Promise AiModelApiKey
   */
  async addApiKey(data: AiModel): Promise<AiModelApiKey> {
    const { model, apiKey } = data;
    // Check if model and apiKey are provided
    if (!model || !apiKey) {
      await this.logAiModelApiKeyEvent(
        this.context.currentUser.id,
        'add api key',
        'Model or API key are required',
        'error'
      );
      throw new ValidationError('Model or API key are required');
    }

    await this.logAiModelApiKeyEvent(
      this.context.currentUser.id,
      'validate api key',
      `Validate API key: ${apiKey}`,
      'info'
    );
    // Validate api key
    await this.userApiKeyService.validateApiKey(model.toLowerCase(), apiKey);

    // Insert API key
    const result = await this.aiModelApiKeyModel.insertApiKey(data);

    await this.logAiModelApiKeyEvent(
      this.context.currentUser.id,
      'add api key',
      `Add API key: ${apiKey}`,
      'info'
    );

    if (!result) {
      throw new Error('Failed to add API key');
    }
    return result;
  }

  /**
   * Edit API key
   * @param data AiModel data
   * @returns Promise AiModelApiKey
   */
  async editApiKey(data: AiModel): Promise<AiModelApiKey> {
    const { model, apiKey } = data;
    // Check if model and apiKey are provided
    if (!model || !apiKey) {
      await this.logAiModelApiKeyEvent(
        this.context.currentUser.id,
        'edit api key',
        'Model or API key are required',
        'error'
      );
      throw new ValidationError('Model or API key are required');
    }

    await this.logAiModelApiKeyEvent(
      this.context.currentUser.id,
      'validate api key',
      `Validate API key: ${apiKey}`,
      'info'
    );
    // Validate api key
    await this.userApiKeyService.validateApiKey(model.toLowerCase(), apiKey);

    // Update API key
    const result = await this.aiModelApiKeyModel.updateApiKey(data);
    if (!result) {
      throw new Error('Failed to update API key');
    }

    await this.logAiModelApiKeyEvent(
      this.context.currentUser.id,
      'edit api key',
      `Edited API key: ${apiKey}`,
      'info'
    );

    return result;
  }

  /**
   * Delete API key
   * @param model Model name
   * @returns Promise<AiModelApiKey>
   */
  async deleteApiKey(model: string): Promise<AiModelApiKey> {
    // Check if model is provided
    if (!model) {
      await this.logAiModelApiKeyEvent(
        this.context.currentUser.id,
        'delete api key',
        'Model is required',
        'error'
      );
      throw new ValidationError('Model is required');
    }

    // Check if model using api key
    const modelData = 
    await this.availableModelModel
    .getAvailableModelByUser(model.toLowerCase(), this.context.currentUser.id);

    // If yes, delete from available models
    if (modelData.length !== 0) {
      await this.availableModelModel.deleteAvailableModel(model.toLowerCase());
    }

    const result = await this.aiModelApiKeyModel.deleteApiKey(model);
    if (!result) {
      throw new Error('Failed to delete API key');
    }

    await this.logAiModelApiKeyEvent(
      this.context.currentUser.id,
      'delete api key',
      `Deleted API key: ${model}`,
      'info'
    );

    return result;
  }

  /**
   * Get model data by model name
   * @param model AI model
   * @returns 
   */
  async getModelDataByModel(model: string): Promise<AiModelApiKey[]> {
    const result = await this.aiModelApiKeyModel.getModelDataByModel(model);
    if (result.length === 0) {
      throw new NotFoundError('No API keys found');
    }
    return result;
  }

  /**
   * Log AI model API key event
   * @access private
   * @param user User ID
   * @param action Action
   * @param details Details
   * @param level Level
   */
  private async logAiModelApiKeyEvent(
    user: string,
    action: string,
    details: string,
    level: string
  ) {
    await this.logService.insertLog({
      user: user,
      action: action,
      details: details,
      component: 'AiModelApiKeyService',
      level: level
    });
  }
}

export default AiModelApiKeyService;
