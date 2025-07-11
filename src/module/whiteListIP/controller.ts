import { Router } from "express";
import { successResponse } from "../../utils/helper.response";
import { requirePermission, Permissions } from "../../utils/helper.permission";
import WhiteListIPService from "./database/services";

const whiteListIPController = (context: any) => {
  const router = Router();
  const whiteListIPService = new WhiteListIPService(context);

  /**
   * Get whitelist IP
   */
  router.get('/get',
    requirePermission(Permissions.WHITELIST_IP_READ), async (req, res, next) => {
      try {
        const whitelist_ip = await whiteListIPService.getWhiteListIP();
        res.status(200).json(successResponse(whitelist_ip));
      } catch (err) {
        next(err);
      }
  });

  /**
   * Add whitelist IP
   */
  router.post('/add',
    requirePermission(Permissions.WHITELIST_IP_CREATE), async (req, res, next) => {
      try {
        const user_id = context.currentUser.id;
        const result = await whiteListIPService.addWhiteListIP(user_id, req.body.ip_address);
        res.status(200).json(successResponse(result));
      } catch (err) {
        next(err);
      }
  });

  /**
   * Edit whitelist IP
   */
  router.post('/edit',
    requirePermission(Permissions.WHITELIST_IP_UPDATE), async (req, res, next) => {
      try {
        const result = await whiteListIPService.editWhiteListIP(req.body);
        res.status(200).json(successResponse(result));
      } catch (err) {
        next(err);
      }
  });

  /**
   * Delete whitelist IP
   */
  router.post('/delete',
    requirePermission(Permissions.WHITELIST_IP_DELETE), async (req, res, next) => {
      try {
        const result = await whiteListIPService.deleteWhiteListIP(req.body.id);
        res.status(200).json(successResponse(result));
      } catch (err) {
        next(err);
      }
  });

  return router;
}

export default whiteListIPController;
