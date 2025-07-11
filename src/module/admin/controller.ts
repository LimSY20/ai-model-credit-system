import { Router } from "express";
import { successResponse } from "../../utils/helper.response";
import { Permissions, requirePermission } from "../../utils/helper.permission";
import AdminService from "./database/services";
import UserService from "../users/database/services";
import UserModel from "../users/database/models";

const adminController = (context: any) => {
  const router = Router();
  const adminService = new AdminService(context);
  const userService = new UserService(context);
  const userModel = new UserModel(context);

  /**
   * Create admin
   */
  router.post('/create-admin',
    requirePermission(Permissions.ADMIN_CREATE), async (req, res, next) => {
      try {
        const createUser = await adminService.createAdmin(req.body);
        res.status(200).json(successResponse(createUser));
      } catch (err) {
        next(err);
      }
  });

  /**
   * Update profile
   */
  router.post("/update-profile",
    requirePermission(Permissions.ADMIN_UPDATE), async (req, res, next) => {
      try {
        const user = await adminService.updateAdminProfile(req.body);
        res.status(200).json(successResponse(user));
      } catch (err) {
        next(err);
      }
  });

  /**
   * Create new user
   */
  router.post('/create-user',
    requirePermission(Permissions.USER_CREATE), async (req, res, next) => {
      try {
        await userService.validation(req.body);
        const user = await userService.createNewUser(req.body);
        res.json(successResponse(user));
      } catch (err) {
        next(err);
      }
  });

  /**
   * View all users
   */
  router.get('/get-all-user',
    requirePermission(Permissions.USER_READ), async (req, res, next) => {
      try {
        const users = await userModel.getAllUserAccount();
        res.status(200).json(successResponse(users));
      } catch (err) {
        next(err);
      }
  });

  /**
   * Edit user
   * Update user information
   */
  router.post('/edit-user',
    requirePermission(Permissions.USER_UPDATE), async (req, res, next) => {
      try {
        const user = await userService.editUser(req.body);
        res.status(200).json(successResponse(user));
      } catch (err) {
        next(err);
      }
  });

  return router;
};

export default adminController;
