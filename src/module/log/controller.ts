import { Router } from 'express';
import { successResponse } from '../../utils/helper.response';
import { requirePermission, Permissions } from '../../utils/helper.permission';
import LogService from './database/services';

const LogController = (context: any) => {
  const router = Router();
  const logService = new LogService(context);

  /**
   * Get all logs
   */
  router.get('/get',
    requirePermission(Permissions.LOG_READ), async (req, res, next) => {
    try {
      const logs = await logService.getLogs();
      res.status(200).json(successResponse(logs));
    } catch (err) {
      next(err);
    }
  });

  return router;
}

export default LogController;
