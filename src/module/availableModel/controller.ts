import { Router } from "express";
import { successResponse } from "../../utils/helper.response";
import { requirePermission, Permissions } from "../../utils/helper.permission";
import AvailableModelService from "./database/services";

const AvailableModelController = (context: any) => {
  const router = Router();
  const availableModelService = new AvailableModelService(context);

  /**
   * View available models added by admin
   * @description user view available models
   */
  router.get('/get', async (req, res, next) => {
    try {
      const models = await availableModelService.getAvailableModels();
      res.status(200).json({success: true, models});
    } catch (err) {
      next(err);
    }
  });

  /**
   * View available models added by admin
   */
  router.get('/get-all',
    requirePermission(Permissions.AVAILABLE_MODEL_READ), async (req, res, next) => {
      try {
        const services = await availableModelService.getAllAvailableModels();
        res.status(200).json(successResponse(services));
      } catch (err) {
        next(err);
      }
  });

  /**
   * Add available AI model
   */
  router.post('/add',
    requirePermission(Permissions.AVAILABLE_MODEL_CREATE), async (req, res, next) => {
      try {
        const add_model = await availableModelService.addAvailableModel(req.body);
        res.status(200).json(successResponse(add_model));
      } catch (err) {
        next(err);
      }
  });

  /**
   * Edit available AI model
   * @description Manage model account type, cost
   */
  router.post('/edit',
    requirePermission(Permissions.AVAILABLE_MODEL_UPDATE), async (req, res, next) => {
      try {
        const update_cost = await availableModelService.editAvailableModel(req.body);
        res.status(200).json(successResponse(update_cost));
      } catch (err) {
        next(err);
      }
  });

  /**
   * Delete available AI model
   */
  router.post('/delete',
    requirePermission(Permissions.AVAILABLE_MODEL_DELETE), async (req, res, next) => {
      try {
        const delete_model = await availableModelService.deleteAvailableModel(req.body.name);
        res.status(200).json(successResponse(delete_model));
      } catch (err) {
        next(err);
      }
  });

  return router;
};

export default AvailableModelController;
