import PostgresHelper from "../../../utils/helper.postgres";
import { hashPassword } from "../../../utils/helper.auth";

export interface User {
  id?: number,
  googleId?: string | null,
  name: string,
  email: string,
  password: string,
  user_type?: string,
  mobile: string,
  country: string,
  date_created: Date | null,
  last_login: Date | null,
}

export interface ContextUser {
  id: number,
  name: string,
  email: string
}

export interface CreateUserData {
  googleId?: string,
  name: string,
  email: string,
  password: string,
  user_type?: string,
  mobile?: string,
  country?: string,
}

export interface UpdateUserData {
  name?: string,
  email?: string,
  newPassword?: string,
  user_type?: string,
  mobile?: string,
  country?: string,
}

export interface UserAccount {
  id: number,
  user_id: number,
  balance: number,
  total_credits: number,
  last_reset: Date,
  subscription_id: number,
  subscription_expiry: Date | null,
}

export interface UserAccountData {
  user_id: number;
  balance: number;
  total_credits: number;
  subscription_id: number;
}

export interface UserCredit {
  user_id: number;
  available_credits: number;
}

export interface Chat {
  model: string,
  name: string,
  credits: number,
  messages: string,
}

class UserModel {
  private context: any;
  private db = PostgresHelper.getInstance();

  constructor(context: any) {
    this.context = context;
  }

  /**
   * Insert user
   * @param user User data to insert
   * @returns Promise User
   */
  async insertUser(user: CreateUserData): Promise<User> {
    const { googleId, name, email, password, user_type, mobile, country } = user;
    const query = `
      INSERT INTO users (
        google_id,
        name,
        email,
        password,
        user_type,
        mobile_number,
        country,
        date_created)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`;
    const hashedPassword = await hashPassword(password);
    const values = [
      googleId,
      name,
      email.toLocaleLowerCase(),
      hashedPassword,
      user_type,
      mobile,
      country,
      new Date()
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  /**
   * Insert user account
   * @param user_account User account data to insert
   * @returns Promise UserAccount
   */
  async insertUserAccount(user_account: UserAccountData): Promise<UserAccount> {
    const { user_id, balance, total_credits, subscription_id } = user_account;
    const query = `
      INSERT INTO accounts (
        user_id,
        balance,
        total_credits,
        last_reset,
        subscription_id,
        subscription_expiry)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`;
    const values = [
      user_id,
      balance,
      total_credits,
      new Date(),
      subscription_id,
      null
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  /**
   * Update user with password
   * @param data User data to update
   * @returns Promise User
   */
  async updateUserWithPassword(data: UpdateUserData): Promise<User> {
    const { name, email, newPassword, user_type, mobile, country } = data;
    const query = `
      UPDATE users
      SET name = $1,
          email = $2,
          password = $3,
          user_type = $4,
          mobile_number = $5,
          country = $6
      WHERE id = $7
      RETURNING *`;
    const values = [
      name,
      email,
      newPassword,
      user_type,
      mobile,
      country,
      this.context.currentUser.id
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  /**
   * Update user
   * @param data User data to update
   * @returns Promise User
   */
  async updateUser(data: UpdateUserData): Promise<User> {
    const { name, email, user_type, mobile, country } = data;
    const query = `
      UPDATE users
      SET name = $1,
          email = $2,
          user_type = $3,
          mobile_number = $4,
          country = $5
      WHERE id = $6
      RETURNING *`;
    const values = [
      name,
      email,
      user_type,
      mobile,
      country,
      this.context.currentUser.id
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete user account
   * @returns Promise UserAccount
   */
  async deleteUserAccount(): Promise<UserAccount> {
    const query = `
      DELETE FROM accounts
      WHERE user_id = $1
      RETURNING *`;
    const result = await this.db.query(query, [this.context.currentUser.id]);
    return result.rows[0];
  }

  /**
   * Delete user
   * @returns Promise User
   */
  async deleteUser(): Promise<User> {
    const query = `
      DELETE FROM users
      WHERE id = $1
      RETURNING *`;
    const result = await this.db.query(query, [this.context.currentUser.id]);
    return result.rows[0];
  }

  /**
   * Update last login
   * @param id User ID
   * @returns Promise User
   */
  async updateLastLogin(id: number): Promise<User> {
    const query = `UPDATE users SET last_login = $1 WHERE id = $2 RETURNING *`;
    const result = await this.db.query(query, [new Date(), id]);
    return result.rows[0];
  }

  /**
   * Update user Google ID
   * @param email User email
   * @param googleId Google ID
   * @returns Promise User
   */
  async updateUserGoogleId(email: string, googleId: string): Promise<User> {
    const query = `UPDATE users SET google_id = $1 WHERE email = $2 RETURNING *`;
    const result = await this.db.query(query, [googleId, email.toLowerCase()]);
    return result.rows[0];
  }

  /**
   * Get user by ID
   * @param id User ID
   * @returns Promise User
   */
  async getUserById(id: string): Promise<User> {
    const query = `SELECT * FROM users WHERE id = $1`;
    const result = await this.db.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Get user by email
   * @param email User email
   * @returns Promise User
   */
  async getUserByEmail(email: string): Promise<User> {
    const query = `SELECT * FROM users WHERE email = $1`;
    const result = await this.db.query(query, [email.toLowerCase()]);
    return result.rows[0];
  }

  /**
   * Get user by Google ID
   * @param googleId Google ID
   * @returns Promise User
   */
  async getUserByGoogleId(googleId: string): Promise<User> {
    const query = `SELECT * FROM users WHERE google_id = $1`;
    const result = await this.db.query(query, [googleId]);
    return result.rows[0];
  }

  /**
   * Get all user accounts
   * @returns Promise UserAccount[]
   */
  async getAllUserAccount(): Promise<UserAccount[]> {
    const query = `SELECT * FROM accounts`;
    const result = await this.db.query(query);
    return result.rows;
  }

  /**
   * Update user account
   * @param data User account data to update
   * @returns Promise UserAccount
   */
  async updateUserAccount(data: Partial<UserAccount>): Promise<UserAccount> {
    const { user_id, balance, total_credits } = data;
    const query = `
      UPDATE accounts
      SET balance = $1, total_credits = $2
      WHERE user_id = $3
      RETURNING *`;
    const result = await this.db.query(query, [balance, total_credits, user_id]);
    return result.rows[0];
  }

  /**
   * Update user credit
   * @param id User ID
   * @param credits Credits to update
   * @returns Promise UserAccount
   */
  async updateUserCredit(id: number, credits: number): Promise<UserAccount> {
    const query = `
      UPDATE accounts
      SET balance = balance - $1, total_credits = total_credits - $1
      WHERE user_id = $2
      RETURNING *`;
    const result = await this.db.query(query, [credits, id]);
    return result.rows[0];
  }

  /**
   * Top up user credits
   * @param credits Credits to top up
   * @returns Promise UserAccount
   */
  async topUpUserCredits(credits: number): Promise<UserAccount> {
    const query = `
      UPDATE accounts
      SET balance = balance + $1, total_credits = total_credits + $1
      WHERE user_id = $2
      RETURNING *`;
    const result = await this.db.query(query, [credits, this.context.currentUser.id]);
    return result.rows[0];
  }

  /**
   * Get user account by ID
   * @param id User ID
   * @returns Promise UserAccount
   */
  async getUserAccountById(id: number): Promise<UserAccount> {
    const query = `SELECT * FROM accounts WHERE user_id = $1`;
    const result = await this.db.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Check if user has paid this month
   * @param accountId Account ID
   * @param subscriptionId Subscription ID
   * @returns Promise boolean
   */
  async hasPaidThisMonth(accountId: number, subscriptionId: number): Promise<boolean> {
    // date_trunc('month', CURRENT_DATE) will return the first day of the current month
    const query = `
      SELECT 1 FROM payments
      WHERE account_id = $1
        AND subscription_id = $2
        AND status = 'paid'
        AND billing_month = date_trunc('month', CURRENT_DATE)
      LIMIT 1`;
    const result = await this.db.query(query, [accountId, subscriptionId]);
    return result.rows.length > 0;
  }

  /**
   * Reset user credit
   * @param id User ID
   * @returns Promise UserAccount
   */
  async resetCredit(id: number, credits: number) {
    const query = `
      UPDATE accounts
      SET balance = $1, total_credits = total_credits + $1
      WHERE user_id = $2
      RETURNING *`;
    const result = await this.db.query(query, [credits, id]);
    return result.rows[0];
  }

  /**
   * Update last reset
   * @param id User ID
   * @returns Promise UserAccount
   */
  async updateLastReset(id: number) {
    const query = `UPDATE accounts SET last_reset = $1 WHERE user_id = $2 RETURNING *`;
    const result = await this.db.query(query, [new Date(), id]);
    return result.rows[0];
  }
}

export default UserModel;
