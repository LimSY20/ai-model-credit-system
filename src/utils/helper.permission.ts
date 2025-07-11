import { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../utils/helper.errors";

export enum Permissions {
  USER_CREATE = "user:create",
  USER_READ = "user:read",
  USER_UPDATE = "user:update",
  USER_DELETE = "user:delete",

  ADMIN_CREATE = "admin:create",
  ADMIN_READ = "admin:read",
  ADMIN_UPDATE = "admin:update",
  ADMIN_DELETE = "admin:delete",

  COUNTRY_READ = "country:read",

  CREDIT_MODE_UPDATE = "creditMode:update",

  USER_OWN_API_KEY_UPDATE = "user:ownApiKey:update",

  API_KEY_CREATE = "apiKey:create",
  API_KEY_READ = "apiKey:read",
  API_KEY_UPDATE = "apiKey:update",
  API_KEY_DELETE = "apiKey:delete",

  AI_MODEL_READ = "aiModel:read",

  AVAILABLE_MODEL_CREATE = "availableModel:create",
  AVAILABLE_MODEL_READ = "availableModel:read",
  AVAILABLE_MODEL_UPDATE = "availableModel:update",
  AVAILABLE_MODEL_DELETE = "availableModel:delete",

  SUBSCRIPTION_CREATE = "subscription:create",
  SUBSCRIPTION_READ = "subscription:read",
  SUBSCRIPTION_UPDATE = "subscription:update",
  SUBSCRIPTION_DELETE = "subscription:delete",

  ADMIN_CONFIG_CREATE = "adminConfig:create",
  ADMIN_CONFIG_READ = "adminConfig:read",
  ADMIN_CONFIG_UPDATE = "adminConfig:update",
  ADMIN_CONFIG_DELETE = "adminConfig:delete",

  WHITELIST_IP_CREATE = "whitelistIp:create",
  WHITELIST_IP_READ = "whitelistIp:read",
  WHITELIST_IP_UPDATE = "whitelistIp:update",
  WHITELIST_IP_DELETE = "whitelistIp:delete",

  BLACKLIST_COUNTRY_CREATE = "blacklistCountry:create",
  BLACKLIST_COUNTRY_READ = "blacklistCountry:read",
  BLACKLIST_COUNTRY_UPDATE = "blacklistCountry:update",
  BLACKLIST_COUNTRY_DELETE = "blacklistCountry:delete",

  ADMIN_PERMISSION_READ = "adminPermission:read",
  ADMIN_PERMISSION_UPDATE = "adminPermission:update",

  PERMISSION_READ = "permission:read",
  PERMISSION_UPDATE = "permission:update",

  LOG_READ = "log:read",
}

export function requirePermission(permission: Permissions) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedError("Unauthorized");
    }

    // Skip permission check if user is an admin
    if (user.isAdmin) {
      return next();
    }

    if (!user.permissions?.includes(permission)) {
      throw new ForbiddenError(
        `Forbidden: You have no permission ${permission}`
      );
    }

    next();
  };
}
