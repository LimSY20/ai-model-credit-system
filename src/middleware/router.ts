import { Router } from 'express';
import { authentication, adminAuthentication } from '../middleware/auth';
import { ipControl } from './ipControl';
import authController from '../module/auth/controller';
import userController from '../module/users/controller';
import userApiKeyController from '../module/userApiKey/controller';
import topUpController from '../module/topup/controller';
import subscriptionController from '../module/subscriptions/controller';
import chatbotController from '../module/chatbot/controller';
import adminController from '../module/admin/controller';
import adminConfigController from '../module/adminConfig/controller';
import adminPermissionController from '../module/adminPermission/controller';
import aiModelApiKeyController from '../module/aiModelApiKey/controller';
import availableModelController from '../module/availableModel/controller';
import whiteListIPController from '../module/whiteListIP/controller';
import countryListController from '../module/countryList/controller';
import logController from '../module/log/controller';

const createRouter = (context: any) => {
  const router = Router();

  // Only allow unauthenticated access to auth routes
  router.use('/auth', authController(context));

  // Ensure only authenticated users can access other routes
  // Protected routes
  router.use(
    '/users',
    authentication(context),
    userController(context));

  router.use(
    '/user-api-key',
    authentication(context),
    userApiKeyController(context));

  router.use(
    '/available-model',
    authentication(context),
    availableModelController(context));

  router.use(
    '/topup',
    authentication(context),
    topUpController(context));

  router.use(
    '/subscriptions',
    authentication(context),
    subscriptionController(context));

  router.use(
    '/chatbot',
    authentication(context),
    chatbotController(context));

  router.use(
    '/admin',
    ipControl(context),
    adminAuthentication(context),
    adminController(context));

  router.use(
    '/admin-config',
    ipControl(context),
    adminAuthentication(context),
    adminConfigController(context));

  router.use(
    '/admin-permission',
    ipControl(context),
    adminAuthentication(context),
    adminPermissionController(context));

  router.use(
    '/ai-model-api-key',
    ipControl(context),
    adminAuthentication(context),
    aiModelApiKeyController(context));

  router.use(
    '/manage-available-model',
    ipControl(context),
    adminAuthentication(context),
    availableModelController(context));

  router.use(
    '/manage-subscriptions',
    ipControl(context),
    adminAuthentication(context),
    subscriptionController(context));

  router.use(
    '/whitelist-ip',
    ipControl(context),
    adminAuthentication(context),
    whiteListIPController(context));

  router.use(
    '/country-list',
    ipControl(context),
    adminAuthentication(context),
    countryListController(context));

  router.use(
    '/log',
    ipControl(context),
    adminAuthentication(context),
    logController(context));

  return router;
};

export default createRouter;
