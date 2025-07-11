import { NotFoundError, ValidationError } from "../../../utils/helper.errors";
import { Subscription, SubscriptionData } from "./models";
import SubscriptionModel from "./models";
import LogService from "../../log/database/services";

class SubscriptionService {
  private context: any;
  private subscriptionModel: SubscriptionModel;
  private logService: LogService;

  constructor(context: any) {
    this.context = context;
    this.subscriptionModel = new SubscriptionModel(context);
    this.logService = new LogService(context);
  }

  /**
   * Get subscription
   * @returns Promise Subscription[]
   */
  async getSubscription(): Promise<Subscription[]> {
    const result = await this.subscriptionModel.getAllSubscriptions();

    await this.logSubscriptionEvent(
      this.context.currentUser.id,
      'get_subscription',
      `Get subscription`,
      'info'
    );

    if (!result) {
      throw new NotFoundError('No subscription found');
    }
    return result;
  }

  /**
   * Add subscription
   * @param id Admin ID
   * @param data Subscription data
   * @returns Promise Subscription
   */
  async addSubscription(id: string, data: SubscriptionData): Promise<Subscription> {
    const { name, monthly_cost, annual_cost, monthly_credit } = data;
    // Check if name and monthly_cost are provided
    if (!name || !monthly_cost || !annual_cost || !monthly_credit) {
      await this.logSubscriptionEvent(
        this.context.currentUser.id,
        'add_subscription',
        `Add subscription: ${name}`,
        'error'
      );
      throw new ValidationError('Name, monthly cost, annual cost, and monthly credit are required');
    }

    // Insert subscription
    const result = await this.subscriptionModel.insertSubscription(data);
    if (!result) {
      throw new Error('Failed to add subscription');
    }

    // Insert log
    await this.logSubscriptionEvent(
      id,
      'add_subscription',
      `Admin with ID: ${id} added subscription: ${name}`,
      'info'
    );
    return result;
  }

  /**
   * Edit subscription
   * @param data Subscription data
   * @returns Promise Subscription
   */
  async editSubscription(data: SubscriptionData): Promise<Subscription> {
    const { id, name, monthly_cost, annual_cost, monthly_credit } = data;
    // Check if name and monthly_cost are provided
    if (!id || !name || !monthly_cost || !annual_cost || !monthly_credit) {
      await this.logSubscriptionEvent(
        this.context.currentUser.id,
        'edit_subscription',
        `Edit subscription: ${name}`,
        'error'
      );
      throw new ValidationError('ID, name, monthly cost, annual cost, and monthly credit are required');
    }

    // Update subscription
    const result = await this.subscriptionModel.updateSubscription(data);
    if (!result) {
      throw new Error('Failed to update subscription');
    }

    // Insert log
    await this.logSubscriptionEvent(
      id.toString(),
      'edit_subscription',
      `Admin with ID: ${id} edited subscription: ${name}`,
      'info'
    );
    return result;
  }

  /**
   * Delete subscription
   * @param id Subscription ID
   * @returns Promise<Subscription>
   */
  async deleteSubscription(id: string): Promise<Subscription> {
    // Check if id is provided
    if (!id) {
      await this.logSubscriptionEvent(
        this.context.currentUser.id,
        'delete_subscription',
        `Delete subscription: ${id}`,
        'error'
      );
      throw new ValidationError('Subscription ID is required');
    }

    // Delete subscription
    const result = await this.subscriptionModel.deleteSubscription(id);
    if (!result) {
      throw new Error('Failed to delete subscription');
    }

    // Insert log
    await this.logSubscriptionEvent(
      id,
      'delete_subscription',
      `Admin with ID: ${id} deleted subscription: ${result.name}`,
      'info'
    );
    return result;
  }

  /**
   * Log subscription event
   * @access private
   * @param user User ID
   * @param action Action
   * @param details Details
   * @param level Level
   */
  private async logSubscriptionEvent(
    user: string,
    action: string,
    details: string,
    level: string
  ) {
    await this.logService.insertLog({
      user: user,
      action: action,
      details: details,
      component: 'SubscriptionService',
      level: level
    });
  }
}

export default SubscriptionService;
