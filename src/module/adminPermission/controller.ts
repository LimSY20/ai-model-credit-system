import { Router } from "express";
import { successResponse } from "../../utils/helper.response";
import { Permissions, requirePermission } from "../../utils/helper.permission";
import AdminPermissionService from "./database/services";

const adminPermissionController = (context: any) => {
  const router = Router();
  const adminPermissionService = new AdminPermissionService(context);

  /**
   * Get permission
   */
  router.get('/get-permission',
    requirePermission(Permissions.PERMISSION_READ), async (req, res, next) => {
      try {
        const permissions = await adminPermissionService.getPermission();
        res.status(200).json(successResponse(permissions));
      } catch (err) {
        next(err);
      }
  });

  /**
   * Edit permission
   */
  router.post('/edit-permission',
    requirePermission(Permissions.PERMISSION_UPDATE), async (req, res, next) => {
      try {
        const result = await adminPermissionService.editPermission(req.body);
        res.status(200).json(successResponse(result));
      } catch (err) {
        next(err);
      }
  });

  router.get('/get-admin-permission',
    requirePermission(Permissions.ADMIN_PERMISSION_READ), async (req, res, next) => {
      try {
        const permissions = await adminPermissionService.getAdminPermission();
        res.status(200).json(successResponse(permissions));
      } catch (err) {
        next(err);
      }
  });

  router.post('/edit-admin-permission',
    requirePermission(Permissions.ADMIN_PERMISSION_UPDATE), async (req, res, next) => {
      try {
        const permissions = await adminPermissionService.editAdminPermission(req.body);
        res.status(200).json(successResponse(permissions));
      } catch (err) {
        next(err);
      }
  });

  return router;
};

export default adminPermissionController;
