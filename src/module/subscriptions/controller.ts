import { Router } from "express";
import { successResponse } from "../../utils/helper.response";
import { requirePermission, Permissions } from "../../utils/helper.permission";
import SubscriptionService from "./database/services";

const subscriptionController = (context: any) => {
  const router = Router();
  const subscriptionService = new SubscriptionService(context);

  /**
   * Get subscription
   * User and admin get subscriptions
   */
  router.get('/get', async (req, res, next) => {
    try {
      const subscription = await subscriptionService.getSubscription();
      res.status(200).json(successResponse(subscription));
    } catch (err) {
      next(err);
    }
  });

  /**
   * Add subscription
   */
  router.post('/add',
    requirePermission(Permissions.SUBSCRIPTION_CREATE), async (req, res, next) => {
      try {
        const user_id = context.currentUser.id;
        const add_subscription = await subscriptionService.addSubscription(user_id, req.body);
        res.status(200).json(successResponse(add_subscription));
      } catch (err) {
        next(err);
      }
  });

  /**
   * Edit subscription
   */
  router.post('/edit',
    requirePermission(Permissions.SUBSCRIPTION_UPDATE), async (req, res, next) => {
      try {
        const edit_subscription = await subscriptionService.editSubscription(req.body);
        res.status(200).json(successResponse(edit_subscription));
      } catch (err) {
        next(err);
      }
  });

  /**
   * Delete subscription
   */
  router.post('/delete',
    requirePermission(Permissions.SUBSCRIPTION_DELETE), async (req, res, next) => {
      try {
        const delete_subscription = await subscriptionService.deleteSubscription(req.body.id);
        res.status(200).json(successResponse(delete_subscription));
      } catch (err) {
        next(err);
      }
  });

  return router;
}

export default subscriptionController;
