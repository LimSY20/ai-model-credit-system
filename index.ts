import express from 'express';
import configs from './src/configs';
import { errorHandler } from './src/utils/helper.errors';
import createRouter from './src/middleware/router';
import createAppContext from './src/utils/helper.context';
import passport from 'passport';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import './src/middleware/passport';
import AdminService from './src/module/admin/database/services';

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

app.use(express.json());
app.use(cookieParser());

app.use(passport.initialize());

(async () => {
  const context = createAppContext();

  await Promise.all([
    new AdminService(context).init()
  ]);

  app.use('/api', createRouter(context));

  app.use(errorHandler);
})();

// Listen on port 3000
app.listen(configs.PORT, () => console.log(`Server is running at http://localhost:${configs.PORT}`));
