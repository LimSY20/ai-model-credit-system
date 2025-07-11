import dotenv from 'dotenv';

dotenv.config();

const configs = (() => {
  return {
    pg_user: process.env.pg_user,
    pg_host: process.env.pg_host,
    pg_database: process.env.pg_database,
    pg_password: process.env.pg_password,
    pg_port: process.env.pg_port,
    PORT: process.env.PORT,
    JWT_SECRET: process.env.jwt_secret,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    default_admin_name: process.env.default_admin_name,
    default_admin_email: process.env.default_admin_email,
    default_admin_password: process.env.default_admin_password
  }
})();

export default configs;
