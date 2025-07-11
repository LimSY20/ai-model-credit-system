import { ConflictError, NotFoundError, ValidationError } from "../../../utils/helper.errors";
import { UserApiKey, AddApiKey } from "./models";
import OpenAIService from "../../services/openai.service";
import DeepSeekService from "../../services/deepseek.service";
import GeminiService from "../../services/gemini.service";
import UserApiKeyModel from "./models";
import LogService from "../../log/database/services";

class UserApiKeyService {
  private context: any;
  private userApiKeyModel: UserApiKeyModel;
  private logService: LogService;

  constructor(context: any) {
    this.context = context;
    this.userApiKeyModel = new UserApiKeyModel(context);
    this.logService = new LogService(context);
  }

  /**
   * Validate API key
   * @param model Model name - e.g. 'openai'
   * @param apiKey API key
   * @returns Promise boolean
   */
  async validateApiKey(model: string, apiKey: string): Promise<boolean> {
    if (!model || !apiKey)
      throw new ValidationError('Model and API Key are required');

    let response;
    try {
      if (model.toLowerCase() === 'openai') {
        response = await new OpenAIService(apiKey).getModel();
      } else if (model.toLowerCase() === 'deepseek') {
        response = await new DeepSeekService(apiKey).getModel();
      } else if (model.toLowerCase() === 'gemini') {
        response = await new GeminiService(apiKey).getModel();
      }
    } catch (err: any) {
      throw new ValidationError('Invalid API Key');
    }
    if (!response)
      throw new ValidationError('Invalid API Key');
    return true;
  }

  /**
   * User view API keys
   * @returns Promise UserApiKey[]
   */
  async getApiKeys(): Promise<UserApiKey[]> {
    const result = await this.userApiKeyModel.getAllApiKeysData();

    await this.logUserApiKeyEvent(
      this.context.currentUser.id,
      'get-api-keys',
      'Get API keys',
      'info'
    );

    if (!result) {
      throw new NotFoundError('No key found');
    }
    return result;
  }

  /**
   * Add API key
   * @param data API key data
   * @returns Promise UserApiKey
   */
  async addApiKey(data: AddApiKey): Promise<UserApiKey> {
    const { model, apiKey } = data;

    // Validate required fields
    if (!model || !apiKey) {
      await this.logUserApiKeyEvent(
        this.context.currentUser.id,
        'Missing required fields',
        'Model or API key are required',
        'error'
      );
      throw new ValidationError('Model, and API Key are required');
    }

    // Avoid Conflict
    const keyExist = await this.userApiKeyModel.getApiKeyByIdAndModel(this.context.currentUser.id, model);
    if (keyExist.length > 0) {
      await this.logUserApiKeyEvent(
        this.context.currentUser.id,
        'Conflict api key',
        'API key already exists',
        'error'
      );
      throw new ConflictError('API key already exists');
    }

    await this.logUserApiKeyEvent(
      this.context.currentUser.id,
      'Validate api key',
      `Validate API key: ${apiKey}`,
      'info'
    );
    // Validate api key
    await this.validateApiKey(model, apiKey);

    // Insert api_keys
    const result = await this.userApiKeyModel.insertApiKey(data);
    if (!result) {
      throw new Error('Failed to add API key');
    }

    // Insert log
    await this.logUserApiKeyEvent(
      this.context.currentUser.id,
      'Add api key',
      `Add API key: ${apiKey}`,
      'info'
    );
    return result;
  }

  /**
   * Edit API key
   * @param data API key data
   * @returns Promise UserApiKey
   */
  async editApiKey(data: AddApiKey): Promise<UserApiKey> {
    const { model, apiKey } = data;

    if (!model || !apiKey) {
      await this.logUserApiKeyEvent(
        this.context.currentUser.id,
        'Missing required fields',
        'Model or API key are required',
        'error'
      );
      throw new ValidationError('Model, and API Key are required');
    }

    await this.logUserApiKeyEvent(
      this.context.currentUser.id,
      'Validate api key',
      `Validate API key: ${apiKey}`,
      'info'
    );
    // Validate api key
    await this.validateApiKey(model, apiKey);

    // Update api_keys
    const result = await this.userApiKeyModel.updateApiKey(data);
    if (!result) {
      throw new Error('Failed to update API key');
    }

    // Insert log
    await this.logUserApiKeyEvent(
      this.context.currentUser.id,
      'Edit api key',
      `Edit API key: ${apiKey}`,
      'info'
    );
    return result;
  }

  /**
   * Delete API key
   * @param model Model name
   * @returns Promise UserApiKey
   */
  async deleteApiKey(model: string): Promise<UserApiKey> {
    if (!model) {
      await this.logUserApiKeyEvent(
        this.context.currentUser.id,
        'Missing required fields',
        'Model is required',
        'error'
      );
      throw new ValidationError('Model is required');
    }

    // Delete api key
    const result = await this.userApiKeyModel.deleteApiKey(model);
    if (!result) {
      throw new Error('Failed to delete API key');
    }

    // Insert log
    await this.logUserApiKeyEvent(
      this.context.currentUser.id,
      'Delete api key',
      `Delete ${model} API key`,
      'info'
    );
    return result;
  }

  /**
   * Log user API key event
   * @access private
   * @param user User ID
   * @param action Action
   * @param details Details
   * @param level Level
   */
  private async logUserApiKeyEvent(
    user: string,
    action: string,
    details: string,
    level: string
  ) {
    await this.logService.insertLog({
      user: user,
      action: action,
      details: details,
      component: 'UserApiKeyService',
      level: level
    });
  }
}

export default UserApiKeyService;
