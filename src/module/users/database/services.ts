import {
  ContextUser,
  CreateUserData,
  User,
  UpdateUserData,
  UserAccount,
  UserCredit
} from './models';
import { hashPassword } from '../../../utils/helper.auth';
import { NotFoundError, ConflictError, ValidationError } from '../../../utils/helper.errors';
import UserModel from './models';
import SubscriptionModel from '../../subscriptions/database/models';
import AdminConfigModel from '../../adminConfig/database/models';
import LogService from '../../log/database/services';

class UserService {
  private context: any;
  private userModel: UserModel;
  private subscriptionModel: SubscriptionModel;
  private adminConfigModel: AdminConfigModel;
  private logService: LogService;

  constructor(context: any) {
    this.context = context;
    this.userModel = new UserModel(context);
    this.subscriptionModel = new SubscriptionModel(context);
    this.adminConfigModel = new AdminConfigModel(context);
    this.logService = new LogService(context);
  }

  /**
   * Validate user data before creating a new user
   * @param user User data to validate
   * @returns 
   */
  async validation(user: Partial<CreateUserData>) {
    const { email, password } = user;

    // Validate required fields
    // Validate email and password
    if (!email || !password)
      throw new ValidationError('Email and password are required');

    // Validate field values
    if (typeof email !== 'string' || !email.trim())
      throw new ValidationError('Invalid email format');

    if (typeof password !== 'string' || password.length < 6)
      throw new ValidationError('Password must be at least 6 characters long');

    // Check if email already exists
    const existingUser = await this.userModel.getUserByEmail(email.toLowerCase());
    if (existingUser)
      throw new ConflictError('Email already exists');

    return true;
  }

  /**
   * Create a new user
   * @param user User data to create a new user
   * @returns 
   */
  async createNewUser(user: CreateUserData): Promise<ContextUser> {
    const result = await this.userModel.insertUser(user);

    if (!result.id) {
      throw new Error('User creation failed');
    }

    // Insert into subscriptions
    const subscriptionResult =
      await this.subscriptionModel.getSubscriptionByName("free");

    if (!subscriptionResult) {
      throw new NotFoundError('Subscription not found');
    }

    // Insert into accounts
    const result_acc = await this.userModel.insertUserAccount({
      user_id: result.id,
      balance: subscriptionResult.monthly_credit,
      total_credits: subscriptionResult.monthly_credit,
      subscription_id: subscriptionResult.id
    })
    if (!result_acc) {
      throw new Error('Account creation failed');
    }

    // Log the creation of the user
    await this.logService.insertLog({
      user: result.id.toString(),
      action: 'create',
      details: `User created with email: ${result.email}`,
      component: 'users',
      level: 'info'
    });

    const newUser = {
      id: result.id,
      name: result.name,
      email: result.email.toLowerCase(),
    }

    return newUser;
  }

  /**
   * Check if user has reset credit
   * @param userId User ID
   * @returns Promise boolean
   */
  async checkAndUpdateLastReset(userId: number): Promise<boolean> {
    const userAccount = await this.userModel.getUserAccountById(userId);

    if (!userAccount?.id)
      throw new NotFoundError('User account not found');

    // Check if last reset is more than a month ago
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // If last reset is more than a month ago, reset credit
    if (userAccount.last_reset < oneMonthAgo) {
      const subscriptionData =
        await this.subscriptionModel.getSubscriptionById(userAccount.subscription_id);

      // If monthly cost is not 0, check for payment
      if (subscriptionData.monthly_cost !== 0) {
        // Check for payment if it is paid
        const hasPaid =
          await this.userModel.hasPaidThisMonth(userAccount.id, subscriptionData.id);

        if (!hasPaid)
          throw new NotFoundError('Payment not found');
      }

      // Reset credit
      await this.userModel.resetCredit(userId, subscriptionData.monthly_credit);

      // Log the reset of the user
      await this.logService.insertLog({
        user: userId.toString(),
        action: 'reset credit',
        details: `User reset credit with user_id: ${userAccount.user_id}`,
        component: 'users',
        level: 'info'
      });

      // Update last reset
      await this.userModel.updateLastReset(userId);

      // Log the update of the user
      await this.logService.insertLog({
        user: userId.toString(),
        action: 'update last reset',
        details: `User updated last reset with user_id: ${userAccount.user_id}`,
        component: 'users',
        level: 'info'
      });
    }

    return true;
  }

  /**
   * Update user profile
   * @param id User ID
   * @param data User data to update
   * @returns Promise User
   */
  async updateUserProfile(id: string, data: UpdateUserData): Promise<User> {
    const user = await this.userModel.getUserById(id);
    if (!user)
      throw new NotFoundError('User not found');

    const { name, email, newPassword, user_type, mobile, country } = data;

    if (!email) {
      await this.logUserEvent(
        this.context.currentUser.id,
        'update profile',
        'Email is required',
        'error'
      );
      throw new ValidationError('Email is required');
    }

    // If have new password
    let result;
    if (newPassword) {
      // Update users
      const hashedPassword = await hashPassword(newPassword);
      result = await this.userModel.updateUserWithPassword({
        name,
        email,
        newPassword: hashedPassword,
        user_type,
        mobile,
        country
      });
    } else {
      // if no new password, update users
      result = await this.userModel.updateUser(data);
    }

    if (!result)
      throw new Error('User update failed');

    // Log the update of the user
    await this.logUserEvent(
      id,
      'update profile',
      `User updated profile with user_id: ${user.id}`,
      'info'
    );

    return result;
  }

  /**
   * Delete user account
   * @param id User ID
   * @returns Promise User
   */
  async deleteUserAccount(id: number): Promise<User> {
    // Need to check user api key
    const user = await this.userModel.getUserAccountById(id);
    if (user) {
      const result = await this.userModel.deleteUserAccount();
      if (!result)
        throw new NotFoundError('User account not found');
    }

    const result = await this.userModel.deleteUser();

    if (!result)
      throw new NotFoundError('User not found');

    // Log the deletion of the user
    await this.logUserEvent(
      id.toString(),
      'delete account',
      `User deleted account with user_id: ${user.id}`,
      'info'
    );

    return result;
  }

  /**
   * Get user credits
   * @param id User ID
   * @returns Promise UserCredit
   */
  async getCredits(id: number): Promise<UserCredit> {
    // Get credit mode from admin_config
    const result =
      await this.adminConfigModel.getAdminConfigByName('credit_mode');

    if (!result)
      throw new NotFoundError('Credit mode not found');

    // Get user account by ID
    const account = await this.userModel.getUserAccountById(id);
    if (!account)
      throw new NotFoundError('User account not found');

    // Determine available credits based on credit mode
    let available_credits;
    if (result.value === 'balance')
      available_credits = account.balance;
    else
      available_credits = account.total_credits;

    await this.logUserEvent(
      this.context.currentUser.id,
      'get credits',
      `User get credits with user_id: ${id}`,
      'info'
    );

    return {
      user_id: account.user_id,
      available_credits
    }
  }

  /**
   * Check if user can use own API key
   * @returns Promise boolean
   */
  async getUseOwnApiKey(): Promise<boolean> {
    const result =
      await this.adminConfigModel.getAdminConfigByName('user_use_own_api_key');

    if (!result)
      throw new NotFoundError('Value not found');

    return result.value === 'true';
  }

  /**
   * Edit user
   * @param data User data to update
   * @returns Promise UserAccount
   */
  async editUser(data: Partial<UserAccount>): Promise<UserAccount> {
    const { user_id, balance, total_credits } = data;
    if (!user_id || !balance || !total_credits) {
      await this.logUserEvent(
        this.context.currentUser.id,
        'Missing required fields',
        'User ID and balance are required',
        'error'
      );
      throw new ValidationError('User ID and balance are required');
    }

    const result = await this.userModel.updateUserAccount(data);

    if (!result)
      throw new NotFoundError('User not found');

    // Log the update of the user
    await this.logUserEvent(
      this.context.currentUser.id,
      'edit user',
      `User edited with user_id: ${user_id}`,
      'info'
    );

    return result;
  }

  /**
   * Log user event
   * @access private
   * @param user User ID
   * @param action Action
   * @param details Details
   * @param level Level
   */
  private async logUserEvent(
    user: string,
    action: string,
    details: string,
    level: string
  ) {
    await this.logService.insertLog({
      user: user,
      action: action,
      details: details,
      component: 'users',
      level: level
    });
  }
}

export default UserService;
