import { Router } from 'express';
import ChatbotService from './database/services';
import { successResponse } from '../../utils/helper.response';

const chatbotController = (context: any) => {
  const router = Router();
  const chatbotService = new ChatbotService(context);

  /**
   * Get all AI model list - e.g. openai, deepseek model list into a list
   */
  router.get('/get-all-ai-model', async (req, res, next) => {
    try {
      const model_list = await chatbotService.getAllModelList();
      res.status(200).json({success: true, model_list});
    } catch (err) {
      next(err);
    }
  })

  /**
   * Get AI model list based on model name and api key
   * User and admin can use this
   */
  router.get('/get-ai-model', async (req, res, next) => {
    try {
      const model_list = await chatbotService.getModelList(req.body.model, context.currentUser?.isAdmin || null);
      res.status(200).json(successResponse(model_list));
    } catch (err) {
      next(err);
    }
  });

  /**
   * Send chat message
   */
  router.post('/send', async (req, res, next) => {
    try {
      const result = await chatbotService.sendChatMessage(req.body);
      res.status(200).json({success: true, result});
    } catch (err) {
      next(err);
    }
  })

  /**
   * Send chat message with user own API key
   */
  router.post('/send-with-api-key', async (req, res, next) => {
    try {
      const result = await chatbotService.sendChatMessageWithApiKey(req.body);
      res.status(200).json({success: true, result});
    } catch (err) {
      next(err);
    }
  })

  return router;
}

export default chatbotController;
