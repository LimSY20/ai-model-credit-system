import { ForbiddenError } from "../utils/helper.errors";
import geoip from 'geoip-lite';
import countries from 'i18n-iso-countries';
import WhiteListIPService from "../module/whiteListIP/database/services";
import WhiteListIPModel from "../module/whiteListIP/database/models";
import CountryListService from "../module/countryList/database/services";
import LogService from "../module/log/database/services";

/**
 * Whitelist IP addresses
 */
const countryListService = new CountryListService(null);
const whiteListIPService = new WhiteListIPService(null);
const whiteListIPModel = new WhiteListIPModel(null);
countries.registerLocale(require('i18n-iso-countries/langs/en.json'));
const logService = new LogService(null);

/**
 * Log IP event
 * @param user User ID
 * @param action Action
 * @param details Details
 * @param level Level
 */
async function logIPEvent(
  user: string,
  action: string,
  details: string,
  level: 'info' | 'warn' | 'error' = 'info'
) {
  try {
    await logService.insertLog({
      user: user || 'system' || 'anonymous',
      action,
      details,
      component: 'ipControl',
      level
    });
  } catch (logError) {
    console.error('Failed to log IP event:', logError);
  }
}

/**
 * Verify IP
 * @param ipAddress 
 * @returns 
 */
async function verifyIP(ipAddress: string) {
  try {
    // Get ip list and set to array
    const IPList = await whiteListIPService.getWhiteListIP();
    const ipList = IPList.map((item: any) => item.ip_address);

    await logIPEvent(
      'system',
      'IP_VERIFICATION_ATTEMPT',
      `Verifying IP: ${ipAddress}`,
      'info'
    );

    // Check if ip in list
    if (!ipList.includes(ipAddress))
      throw new ForbiddenError('Forbidden');

    return ipAddress;
  } catch (error) {
    await logIPEvent(
      'system',
      'IP_VERIFICATION_FAILED',
      `IP verification failed for ${ipAddress}: ${error}`,
      'error'
    );
    throw error;
  }
}

/**
 * Verify country
 * @param ipAddress 
 * @returns 
 */
async function verifyCountry(ipAddress: string) {
  // Check the ip address is from where
  const geo = geoip.lookup(ipAddress);

  // Get country list
  const countryList = await countryListService.getBlackListCountry();

  // Get country name
  const countryName = geo?.country ? countries.getName(geo.country, 'en') : undefined;

  // Set to array
  const country = countryList.map((item: any) => item.country_name.toLowerCase());

  // Check if country in blacklist
  if (country.includes(countryName?.toLowerCase()))
    throw new ForbiddenError('Forbidden');

  return countryName;
}

/**
 * IP control middleware
 * @param context 
 * @returns 
 */
export function ipControl (context: any) {
  return async (req: any, res: any, next: any) => {
    try {
      // Get ip from headers
      const clientIP = req.headers['x-forwarded-for'] ||
                      req.connection.remoteAddress ||
                      req.socket.remoteAddress ||
                      req.connection.socket.remoteAddress ||
                      req.ip;

      // Get client ip
      // comment this for localhost testing purpose
      // const ipAddress = clientIP.split(',')[0].trim().replace('::ffff:', '');

      // For localhost testing only
      let ipAddress = clientIP.split(',')[0].trim().replace('::ffff:', '');
      if (ipAddress === '::1') ipAddress = '127.0.0.1';

      await logIPEvent(
        req.user?.id || 'anonymous',
        'REQUEST_RECEIVED',
        `Request from IP: ${ipAddress}`,
        'info'
      );

      const ip = await verifyIP(ipAddress);
      const country = await verifyCountry(ipAddress);

      if (ip && country) {
        await whiteListIPModel.updateIPLogin(ipAddress);

        await logIPEvent(
          req.user?.id || 'anonymous',
          'ACCESS_GRANTED',
          `Access granted to IP: ${ipAddress} from country: ${country}`,
          'info'
        );
      }
      next();
    } catch (err) {
      await logIPEvent(
        req.user?.id || 'anonymous',
        'ACCESS_DENIED',
        `Access denied: ${err}`,
        'error'
      );
      next(err);
    }
  }
}
