import { Router } from 'express';
import { successResponse } from '../../utils/helper.response';
import UserApiKeyService from './database/services';

const userApiKeyController = (context: any) => {
  const router = Router();
  const userApiKeyService = new UserApiKeyService(context);

  /**
   * Get user API keys
   */
  router.get('/get', async (req, res, next) => {
    try {
      const result = await userApiKeyService.getApiKeys();
      res.status(200).json(successResponse(result));
    } catch (err) {
      next(err);
    };
  });

  /**
   * User add their own API key
   */
  router.post('/add', async (req, res, next) => {
    try {
      const result = await userApiKeyService.addApiKey(req.body);
      res.status(200).json(successResponse(result));
    } catch (err) {
      next(err);
    }
  });

  /**
   * User edit their own API key
   */
  router.post('/edit', async (req, res, next) => {
    try {
      const result = await userApiKeyService.editApiKey(req.body);
      res.status(200).json(successResponse(result));
    } catch (err) {
      next(err);
    }
  });

  /**
   * User delete their own API key
   */
  router.post('/delete', async (req, res, next) => {
    try {
      const result = await userApiKeyService.deleteApiKey(req.body.model);
      res.status(200).json(successResponse(result));
    } catch (err) {
      next(err);
    }
  });

  return router;
}

export default userApiKeyController;
