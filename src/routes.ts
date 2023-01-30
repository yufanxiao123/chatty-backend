import { authMiddleware } from './shared/globals/helpers/auth-middleware';
import { serverAdapter } from '@service/queues/base.queue';
import { authRoutes } from '@auth/routes/authRoutes';
import { Application } from 'express';
import { currentUserRoutes } from '@auth/routes/currentRoutes';

const BASE_PATH = '/api/v1';

export default (app: Application) => {
  //define function routes()
  const routes = () => {
    app.use('/queues', serverAdapter.getRouter());
    app.use(BASE_PATH, authRoutes.routes());
    app.use(BASE_PATH, authRoutes.signoutRoute());

    app.use(BASE_PATH, authMiddleware.verifyUser, currentUserRoutes.routes());
  };
  routes();
};
