import { TopUpPlan } from "./models";
import { NotFoundError, ValidationError } from "../../../utils/helper.errors";
import UserModel from "../../users/database/models";
import TopUpModel from "./models";
import LogService from "../../log/database/services";

class topUpService {
  private context: any;
  private userModel: UserModel;
  private topUpModel: TopUpModel;
  private logService: LogService;

  constructor(context: any) {
    this.context = context;
    this.userModel = new UserModel(context);
    this.topUpModel = new TopUpModel(context);
    this.logService = new LogService(context);
  }

  /**
   * Get top up plans
   * @returns Promise TopUpPlan[]
   */
  async getTopUpPlans(): Promise<TopUpPlan[]> {
    const result = await this.topUpModel.getAllTopUpPlans();

    await this.logTopUpEvent(
      this.context.currentUser.id,
      'get-top-up-plans',
      'Get top up plans',
      'info'
    );

    if (!result) {
      throw new NotFoundError('No top up plans found');
    }
    return result;
  }

  /**
   * Top up credits
   * @param data Amount to top up
   * @returns Promise void
   */
  async topUpCredits(data: Partial<TopUpPlan>) {
    const { credits } = data;
    if (!credits) {
      await this.logTopUpEvent(
        this.context.currentUser.id,
        'top-up-credits',
        'Credits are required',
        'error'
      );
      throw new ValidationError('Credits are required');
    }

    const account = await this.userModel.getUserAccountById(this.context.currentUser.id);
    if (!account)
      throw new NotFoundError('User account not found');

    // Make Payment
    // Update transaction

    const result = await this.userModel.topUpUserCredits(credits);
    if (!result)
      throw new Error('User update failed');

    await this.logTopUpEvent(
      this.context.currentUser.id,
      'top-up-credits',
      `Top up credits: ${credits}`,
      'info'
    );

    return result;
  }

  /**
   * Log top up event
   * @access private
   * @param user User ID
   * @param action Action performed
   * @param details Details of the action
   * @param level Level of the log (info, error, etc.)
   */
  private async logTopUpEvent(
    user: string,
    action: string,
    details: string,
    level: string
  ) {
    await this.logService.insertLog({
      user: user,
      action: action,
      details: details,
      component: 'topUpService',
      level: level
    });
  }
}

export default topUpService;
