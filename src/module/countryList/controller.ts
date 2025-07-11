import { Router } from "express";
import { successResponse } from "../../utils/helper.response";
import { requirePermission, Permissions } from "../../utils/helper.permission";
import BlackListCountryService from "./database/services";

const countryListController = (context: any) => {
  const router = Router();
  const blackListCountryService = new BlackListCountryService(context);

  /**
   * Get country list
   */
  router.get('/get', async (req, res, next) => {
    try {
      const result = await blackListCountryService.getCountryList();
      res.status(200).json(successResponse(result));
    } catch (err) {
      next(err);
    }
  });

  /**
   * Get blacklist country
   */
  router.get('/get-blacklist',
    requirePermission(Permissions.BLACKLIST_COUNTRY_READ), async (req, res, next) => {
      try {
        const blacklist_country = await blackListCountryService.getBlackListCountry();
        res.status(200).json(successResponse(blacklist_country));
      } catch (err) {
        next(err);
      }
  });

  /**
   * Add blacklist country
   */
  router.post('/add-blacklist',
    requirePermission(Permissions.BLACKLIST_COUNTRY_CREATE), async (req, res, next) => {
      try {
        const result = await blackListCountryService.addBlackListCountry(req.body.country_name);
        res.status(200).json(successResponse(result));
      } catch (err) {
        next(err);
      }
  });

  /**
   * Edit blacklist country
   */
  router.post('/edit-blacklist',
    requirePermission(Permissions.BLACKLIST_COUNTRY_UPDATE), async (req, res, next) => {
      try {
        const result = await blackListCountryService.editBlackListCountry(req.body);
        res.status(200).json(successResponse(result));
      } catch (err) {
        next(err);
      }
  });

  /**
   * Delete blacklist country
   */
  router.post('/delete-blacklist',
    requirePermission(Permissions.BLACKLIST_COUNTRY_DELETE), async (req, res, next) => {
      try {
        const result = await blackListCountryService.deleteBlackListCountry(req.body.country_name);
        res.status(200).json(successResponse(result));
      } catch (err) {
        next(err);
      }
  });

  return router;
};

export default countryListController;
