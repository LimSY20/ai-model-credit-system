import { Router } from 'express';
import { requirePermission, Permissions } from '../../utils/helper.permission';
import { successResponse } from '../../utils/helper.response';
import AiModelApiKeyService from './database/services';

const aiModelApiKeyController = (context: any) => {
  const router = Router();
  const aiModelApiKeyService = new AiModelApiKeyService(context);

  /**
   * View all Ai model API keys
   */
  router.get('/get',
    requirePermission(Permissions.API_KEY_READ), async (req, res, next) => {
      try {
        const api_keys = await aiModelApiKeyService.getAllApiKeys();
        res.status(200).json(successResponse(api_keys));
      } catch (err) {
        next(err);
      }
  });

  /**
   * Add Ai model API key
   */
  router.post('/add',
    requirePermission(Permissions.API_KEY_CREATE), async (req, res, next) => {
      try {
        const add_api_key = await aiModelApiKeyService.addApiKey(req.body);
        res.status(200).json(successResponse(add_api_key));
      } catch (err) {
        next(err);
      }
  });

  /**
   * Edit Ai model API key
   */
  router.post('/edit',
    requirePermission(Permissions.API_KEY_UPDATE), async (req, res, next) => {
      try {
        const edit_api_key = await aiModelApiKeyService.editApiKey(req.body);
        res.status(200).json(successResponse(edit_api_key));
      } catch (err) {
        next(err);
      }
  });

  /**
   * Delete Ai model API key
   */
  router.post('/delete',
    requirePermission(Permissions.API_KEY_DELETE), async (req, res, next) => {
      try {
        const delete_api_key = await aiModelApiKeyService.deleteApiKey(req.body.model);
        res.status(200).json(successResponse(delete_api_key));
      } catch (err) {
        next(err);
      }
  });

  return router;
};

export default aiModelApiKeyController;
