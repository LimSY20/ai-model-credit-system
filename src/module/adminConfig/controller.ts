import { Router } from 'express';
import { successResponse } from '../../utils/helper.response';
import { requirePermission, Permissions } from '../../utils/helper.permission';
import AdminConfigService from './database/services';

const adminConfigController = (context: any) => {
  const router = Router();
  const adminConfigService = new AdminConfigService(context);

  /**
   * Get admin config
   */
  router.get('/get',
    requirePermission(Permissions.ADMIN_CONFIG_READ), async (req, res, next) => {
      try {
        const admin_config = await adminConfigService.getAdminConfig();
        res.status(200).json(successResponse(admin_config));
      } catch (err) {
        next(err);
      }
  });

  /**
   * Add admin config
   */
  router.post('/add',
    requirePermission(Permissions.ADMIN_CONFIG_CREATE), async (req, res, next) => {
      try {
        const add_config = await adminConfigService.addAdminConfig(req.body);
        res.status(200).json(successResponse(add_config));
      } catch (err) {
        next(err);
      }
  });

  /**
   * Edit admin config
   */
  router.post('/edit',
    requirePermission(Permissions.ADMIN_CONFIG_UPDATE), async (req, res, next) => {
      try {
        const edit_config = await adminConfigService.editAdminConfig(req.body);
        res.status(200).json(successResponse(edit_config));
      } catch (err) {
        next(err);
      }
  });

  /**
   * Delete admin config
   */
  router.post('/delete',
    requirePermission(Permissions.ADMIN_CONFIG_DELETE), async (req, res, next) => {
      try {
        const delete_config = await adminConfigService.deleteAdminConfig(req.body.name);
        res.status(200).json(successResponse(delete_config));
      } catch (err) {
        next(err);
      }
  });

  return router;
}

export default adminConfigController;
