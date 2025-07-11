import { Chat } from "./models";
import { NotFoundError, ValidationError } from "../../../utils/helper.errors";
import OpenAIService from "../../services/openai.service";
import DeepSeekService from "../../services/deepseek.service";
import GeminiService from "../../services/gemini.service";
import UserService from "../../users/database/services";
import UserModel from "../../users/database/models";
import AiModelApiKeyService from "../../aiModelApiKey/database/services";
import AvailableModelModel from "../../availableModel/database/models";
import AdminConfigModel from "../../adminConfig/database/models";
import UserApiKeyModel from "../../userApiKey/database/models";
import LogService from "../../log/database/services";

class ChatbotService {
  private context: any;
  private apiKey: any;
  private userService: UserService;
  private userModel: UserModel;
  private aiModelApiKeyService: AiModelApiKeyService;
  private availableModelModel: AvailableModelModel;
  private adminConfigModel: AdminConfigModel;
  private userApiKeyModel: UserApiKeyModel;
  private logService: LogService;

  constructor(
    context: any,
    services?: {
      userService?: UserService;
      userModel?: UserModel;
      aiModelApiKeyService?: AiModelApiKeyService;
      availableModelModel?: AvailableModelModel;
      adminConfigModel?: AdminConfigModel;
      userApiKeyModel?: UserApiKeyModel;
      logService?: LogService;
  }) {
    this.context = context;
    this.userService = services?.userService || new UserService(context);
    this.userModel = services?.userModel || new UserModel(context);
    this.aiModelApiKeyService = services?.aiModelApiKeyService || new AiModelApiKeyService(context);
    this.availableModelModel = services?.availableModelModel || new AvailableModelModel(context);
    this.adminConfigModel = services?.adminConfigModel || new AdminConfigModel(context);
    this.userApiKeyModel = services?.userApiKeyModel || new UserApiKeyModel(context);
    this.logService = services?.logService || new LogService(context);
  }

  /**
   * Get AI service based on model name
   * @access private
   * @param model AI model name - openai
   * @returns AI service
   */
  private aiService(model: string) {
    const apiKey = this.apiKey;
    if (model.toLowerCase() === 'openai') {
      return new OpenAIService(apiKey);
    } else if (model.toLowerCase() === 'deepseek') {
      return new DeepSeekService(apiKey);
    } else if (model.toLowerCase() === 'gemini') {
      return new GeminiService(apiKey);
    }
    return null;
  }

  /**
   * Get all AI model list - e.g. openai, deepseek model list into a list
   * @description Get all AI model list by user model added in db
   * @returns Promise AiModel[]
   */
  async getAllModelList() {
    const model_data = await this.userApiKeyModel.getAllApiKeysData();

    if (!model_data)
      return [];

    const allModels: any = {};

    for (const item of model_data) {
      const { model } = item;

      const service = this.aiService(model);
      const all_model = await service?.getModel();

      if (Array.isArray(all_model))
        allModels[model] = all_model;
    }

    return allModels;
  }

  /**
   * Get AI model list based on model name
   * @param model AI model name - openai
   * @param isAdmin Is admin
   * @returns Promise AiModel[]
   */
  async getModelList(model: string, isAdmin: boolean | null) {
    const id = this.context.currentUser.id;

    await this.logChatbotEvent(
      id,
      'get-model-list',
      `Get model list: ${model}`,
      'info'
    );

    // Check if model is provided
    if (!model) {
      await this.logChatbotEvent(
        id,
        'get-model-list',
        'Model is required',
        'error'
      );
      throw new ValidationError('Model is required');
    }

    let result;
    // Get model from database
    if (isAdmin === null)
      result =
        await this.userApiKeyModel.getApiKeyByIdAndModel(id, model.toLowerCase());
    else
      result = await this.aiModelApiKeyService.getModelDataByModel(model.toLowerCase());

    if (!result)
      throw new NotFoundError('Model not found');

    // If model is openai
    this.apiKey = result[0].api_key;
    const service = this.aiService(model.toLowerCase());
    const all_model = await service?.getModel();
    return all_model;
  }

  /**
   * Send chat message with API key
   * @param model AI model name
   * @param name AI model name
   * @param messages Chat messages
   * @returns Chat response
   */
  private async sendMessage(model: string, name: string, messages: string) {
    const service = this.aiService(model.toLowerCase());
    const response = await service?.getChatCompletion(name, messages);

    return response;
  }

  /**
   * Send chat message with available models API key
   * @param data Chat data
   * @returns Chat response
   */
  async sendChatMessage(data: Chat) {
    try {
      const id = this.context.currentUser.id;

      const { model, name, credits, messages } = data;
      if (!model || !name) {
        await this.logChatbotEvent(
          id,
          'Missing required fields',
          'Model and name are required',
          'error'
        );
        throw new ValidationError('Model and name are required');
      }

      // Get user credit
      const credit = await this.userService.getCredits(id);
      if (!credit)
        throw new NotFoundError('User not found');

      // Check if user has enough credits
      if (credit.available_credits < credits) {
        // Insert log
        await this.logChatbotEvent(
          id,
          'Credit insufficient',
          `User ${id} has insufficient credits. Required: ${credits}, Available: ${credit.available_credits}`,
          'error'
        );
        throw new ValidationError('Insufficient credits. Pls top up');
      }

      // Get api key
      const keyData = await this.availableModelModel.getAvailableModelsApiKeyByModel(model, name)
      if (!keyData)
        throw new NotFoundError('API key not found');

      await this.logChatbotEvent(
        id,
        'Message sent',
        'Send chat message with available models API key',
        'info'
      )

      // Set api key
      this.apiKey = keyData.api_key;
      // Send message
      const response = await this.sendMessage(model, name, messages);

      // Insert log
      await this.logChatbotEvent(
        id,
        'Message retrieved',
        'Message retrieved by models',
        'info'
      );

      // Deduct credit
      if (response) {
        await this.userModel.updateUserCredit(id, credits);

        // Insert log
        await this.logChatbotEvent(
          id,
          'Deduct credit',
          `Deduct credit: ${credits}`,
          'info'
        );
      } else {
        throw new Error('Failed to update credit');
      }

      return response;
    } catch (err) {
      throw err;
    }
  }

  /**
   * Send chat message with user API key
   * @description Check if user using own API Key will deduct credits
   ** If will, check credits, if not, pass, will and wont deduct credit after the response
   * @param id User ID
   * @param data Chat data
   * @returns Chat response
   */
  async sendChatMessageWithApiKey(data: Chat) {
    const id = this.context.currentUser.id;
    const { model, name, credits, messages } = data;
    if (!model || !name || !messages) {
      await this.logChatbotEvent(
        id,
        'Missing required fields',
        'Model, name and messages are required',
        'error'
      );
      throw new ValidationError('Model, name and messages are required');
    }

    // Already check if the user can use their own key
    // Check if will deduct credit
    const result = await this.adminConfigModel.getAdminConfigByName('deduct_credit_using_own_key');
    if (!result)
      throw new NotFoundError('Configuration not found');

    // If deduct credit
    if (result.value === 'true') {
      // Get user credit
      const credit = await this.userService.getCredits(id);
      if (!credit)
        throw new NotFoundError('User not found');

      // Check user credit
      if (credit.available_credits < credits) {
        // Insert log
        await this.logChatbotEvent(
          id,
          'Check credits',
          `User ${id} has insufficient credits. Required: ${credits}, Available: ${credit.available_credits}`,
          'error'
        );
        throw new ValidationError('Insufficient credits. Pls top up');
      }
    }

    await this.logChatbotEvent(
      id,
      'Message sent',
      'Send chat message with user API key',
      'info'
    )

    // Get api key
    const keyData = await this.userApiKeyModel.getApiKeyByIdAndModel(this.context.currentUser.id, model.toLowerCase());
    if (!keyData)
      throw new NotFoundError('API key not found');

    // Set api key
    this.apiKey = keyData[0].api_key;
    // Send message
    const response = await this.sendMessage(model, name, messages);

    // Insert log
    await this.logChatbotEvent(
      id,
      'Message retrieved',
      'Message retrieved by user API key',
      'info'
    );

    // Deduct credit
    if (result.value === 'true' && response) {
      await this.userModel.updateUserCredit(id, credits);

      // Insert log
      await this.logChatbotEvent(
        id,
        'Deduct credit',
        `Deduct credit: ${credits}`,
        'info'
      );
    } else {
      throw new Error('Failed to update credit');
    }

    return response;
  }

  /**
   * Log chatbot event
   * @access private
   * @param user User ID
   * @param action Action
   * @param details Details
   * @param level Level
   */
  private async logChatbotEvent(
    user: string,
    action: string,
    details: string,
    level: string
  ) {
    await this.logService.insertLog({
      user: user,
      action: action,
      details: details,
      component: 'ChatbotService',
      level: level});
  }
}

export default ChatbotService;
