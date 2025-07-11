import { Router } from 'express';
import { successResponse } from '../../utils/helper.response';
import UserService from './database/services';

const userController = (context: any) => {
  const router = Router();
  const userService = new UserService(context);

  /**
   * Update user profile
   */
  router.post('/update-profile', async (req, res, next) => {
    try {
      const user_id = context.currentUser.id;
      const user = await userService.updateUserProfile(user_id, req.body);
      res.status(200).json(successResponse(user));
    } catch (err) {
      next(err);
    }
  });

  /**
   * Delete user account
   */
  router.post('/delete-account', async (req, res, next) => {
    try {
      const user_id = context.currentUser.id;
      const result = await userService.deleteUserAccount(user_id);
      res.status(200).json(successResponse(result));
    } catch (err) {
      next(err);
    }
  });

  /**
   * Get user credits
   */
  router.get('/get-credits', async (req, res, next) => {
    try {
      const user_id = context.currentUser.id;
      const getCredits = await userService.getCredits(user_id);
      res.status(200).json(successResponse(getCredits));
    } catch (err) {
      next(err);
    }
  });

  /**
   * Check if user can use own api key
   */
  router.get('/get-use-own-api-key', async (req, res, next) => {
    try {
      const result = await userService.getUseOwnApiKey();
      res.status(200).json(successResponse(result));
    } catch (err) {
      next(err);
    }
  });

  return router;
}

export default userController;
