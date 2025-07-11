import { CountryBlackList, CountryBlackListData } from "./models";
import { NotFoundError, ValidationError } from "../../../utils/helper.errors";
import CountryListModel from "./models";
import LogService from "../../log/database/services";

class CountryListService {
  private context: any;
  private countryListModel: CountryListModel;
  private logService: LogService;

  constructor(context: any) {
    this.context = context;
    this.countryListModel = new CountryListModel(context);
    this.logService = new LogService(context);
  }

  /**
   * Get country list, filter country list from blacklist country
   * @returns Promise string[]
   */
  async getCountryList(): Promise<string[]> {
    await this.logCountryListEvent(
      this.context.currentUser.id,
      'get-country-list',
      'Get country list',
      'info'
    );

    // Get country list
    const response = await fetch('https://restcountries.com/v3.1/all?fields=name');
    const data = await response.json();

    if (!Array.isArray(data))
      throw new Error('Failed to get country list');

    const allCountries = data.map((country: any) => country.name.common).sort();

    // Get blacklist country list from database
    const result = await this.getBlackListCountry();
    const blackListCountry = result.map((country: any) => country.country_name);

    // Filter country list
    const filtered = allCountries.filter((country: any) => !blackListCountry.includes(country));

    return filtered;
  }

  /**
   * Get black list country
   * @returns Promise CountryBlackList[]
   */
  async getBlackListCountry(): Promise<CountryBlackList[]> {
    const result = await this.countryListModel.getAllBlackListCountry();

    let user_id = 'anonymous';
    if (this.context !== null)
      user_id = this.context.currentUser.id;

    await this.logCountryListEvent(
      user_id,
      'get-blacklist-country',
      'Get black list country',
      'info'
    );

    if (!result)
      throw new NotFoundError('No black list country found');
    return result;
  }

  /**
   * Add black list country
   * @param country_name Country name
   * @returns Promise CountryBlackList
   */
  async addBlackListCountry(country_name: string): Promise<CountryBlackList> {
    // Check if country name is provided
    if (!country_name) {
      await this.logCountryListEvent(
        this.context.currentUser.id,
        'Missing required fields',
        'Country name is required',
        'error'
      );
      throw new ValidationError('Country name is required');
    }

    // Insert black list country
    const result = await this.countryListModel.insertBlackListCountry(country_name);
    if (!result)
      throw new Error('Failed to add black list country');

    // Insert log
    await this.logCountryListEvent(
      this.context.currentUser.id,
      'add-blacklist-country',
      `Add blacklist country: ${country_name}`,
      'info'
    );
    return result;
  }

  /**
   * Edit black list country
   * @param data CountryBlackList data
   * @returns Promise CountryBlackList
   */
  async editBlackListCountry(data: CountryBlackListData): Promise<CountryBlackList> {
    const { id, country_name } = data;
    // Check if country name is provided
    if (!id || !country_name) {
      await this.logCountryListEvent(
        this.context.currentUser.id,
        'Missing required fields',
        'ID and country name are required',
        'error'
      );
      throw new ValidationError('ID and country name are required');
    }

    // Update black list country
    const result = await this.countryListModel.updateBlackListCountry(data);
    if (!result)
      throw new Error('Failed to update country name');

    // Insert log
    await this.logCountryListEvent(
      this.context.currentUser.id,
      'edit-blacklist-country',
      `Edit blacklist country: ${country_name}`,
      'info'
    );
    return result;
  }

  /**
   * Delete black list country
   * @param country_name Country name
   * @returns Promise CountryBlackList
   */
  async deleteBlackListCountry(country_name: string): Promise<CountryBlackList> {
    // Check if country name is provided
    if (!country_name) {
      await this.logCountryListEvent(
        this.context.currentUser.id,
        'Missing required fields',
        'Country name is required',
        'error'
      );
      throw new ValidationError('Country name is required');
    }

    const result = await this.countryListModel.deleteBlackListCountry(country_name);
    if (!result)
      throw new Error('Failed to delete country name');

    // Insert log
    await this.logCountryListEvent(
      this.context.currentUser.id,
      'delete-blacklist-country',
      `Delete blacklist country: ${country_name}`,
      'info'
    );
    return result;
  }

  /**
   * Log country list event
   * @access private
   * @param user User ID
   * @param action Action
   * @param details Details
   * @param level Level
   */
  private async logCountryListEvent(
    user: string,
    action: string,
    details: string,
    level: string
  ) {
    await this.logService.insertLog({
      user: user,
      action: action,
      details: details,
      component: 'CountryListService',
      level: level,
    });
  }
}

export default CountryListService;
