import { Router } from 'express';
import { successResponse } from '../../utils/helper.response';
import TopUpService from './database/services';

const topUpController = (context: any) => {
  const router = Router();
  const topUpService = new TopUpService(context);

  /**
   * Get top up plans
   */
  router.get('/get-plans', async (req, res, next) => {
    try {
      const result = await topUpService.getTopUpPlans();
      res.status(200).json(successResponse(result));
    } catch (err) {
      next(err);
    }
  })

  /**
   * Top up credits
   */
  router.post('/top-up-credits', async (req, res, next) => {
    try {
      const result = await topUpService.topUpCredits(req.body);
      res.status(200).json(successResponse(result));
    } catch (err) {
      next(err);
    }
  })

  return router;
}

export default topUpController;
