import { authMiddleware } from './shared/globals/helpers/auth-middleware';
import { serverAdapter } from '@service/queues/base.queue';
import { authRoutes } from '@auth/routes/authRoutes';
import { Application } from 'express';
import { currentUserRoutes } from '@auth/routes/currentRoutes';
import { postRoutes } from '@post/routes/postRoutes';
import { healthRoutes } from '@user/routes/healthRoutes';

const BASE_PATH = '/api/v1';

export default (app: Application) => {
  //define function routes()
  const routes = () => {
    /**
     * app.use(BASE_PATH, middleware, router); mount middleware functions and route handlers at a specified base path
     * @param BASE_PATH: This is the base path at which the middleware and route handlers will be mounted. For example, if BASE_PATH is '/api', the middleware and route handlers will be mounted at '/api'.
     * @param middleware: This is the middleware function that will be executed before the route handler. Middleware functions are functions that have access to the request and response objects, and are used to modify or process the request before it is passed on to the route handler.
     * @param router: Router是一个function， This is the route handler that will be executed after the middleware. The route handler is responsible for handling the incoming request and sending a response to the client.
     */
    //to use multiple middleware function: app.use(BASE_PATH, middleware1, router);app.use(BASE_PATH, middleware2, router);
    // or : app.use(BASE_PATH, middleware1, middleware2, router);

    //the bull-board UI is mounted at the /queues route of the express app. When you navigate to http://localhost:3000/queues, you will see the bull-board UI, which provides information about the state of your queues, as well as tools for managing and monitoring them.
    app.use('/queues', serverAdapter.getRouter());
    app.use(BASE_PATH, authRoutes.routes());
    app.use(BASE_PATH, authRoutes.signoutRoute());
    app.use(healthRoutes.health());
    app.use(BASE_PATH, authMiddleware.verifyUser, currentUserRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, postRoutes.routes());
  };
  routes();
};
