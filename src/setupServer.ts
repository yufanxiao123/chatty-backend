import { SocketIOPostHandler } from './shared/sockets/post';
//install express in terminal at first
import { Application, json, urlencoded, Response, Request, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import cookieSession from 'cookie-session';
import HTTP_STATUS from 'http-status-codes';
import 'express-async-errors';
import compress from 'compression';
import compression from 'compression';
import { config } from '@root/config';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import applicationRoutes from '@root/routes';
import Logger from 'bunyan';
import { CustomError, IErrorResponse } from '@global/helpers/error-handler';

const SERVER_PORT = 8080;
const log: Logger = config.createLogger('server');

export class ChattyServer {
  private app: Application;

  //app: a express instance
  constructor(app: Application) {
    this.app = app;
  }

  public start(): void {
    this.securityMiddleware(this.app);
    this.standardMiddleware(this.app);
    this.routeMiddleware(this.app);
    this.globalErrorHandler(this.app);
    this.startServer(this.app);
  }

  //install some security/standard middleware in terminal: npm i cors helmet hpp cookie-session compression express-async-errors http-status-codes
  private securityMiddleware(app: Application): void {
    /**
     * app.use() method is used to apply middleware functions globally to all incoming requests to the application.
     * app.use(function (req, res, next) {
     * console.log(new Date(), req.url);
     * next();
     * });
     * The next function is used to pass control to the next middleware function in the application's request-response cycle.
     * This allows multiple middleware functions to be combined and used together to implement complex functionality.
     */
    app.use(
      /**
       * The cookieSession function is a factory function that generates middleware for session management.
       * The app.use method is used to apply this middleware to all incoming requests to the application
       * When a user starts a session on a server, the server generates a session ID and stores the user's information (such as name, preferences, etc.) in a database that is associated with the session ID. This session ID is then sent to the client in the form of a cookie, which the client can use to identify itself in subsequent requests to the server. The server can use the session ID in the cookie to look up the user's information in the database and determine the state of the user's session.
       */
      cookieSession({
        name: 'session', //name of the cookie,
        keys: [config.SECRET_KEY_ONE!, config.SECRET_KEY_TWO!], // the secret key used to sign the cookie,
        maxAge: 24 * 7 * 3600000, // and the maximum age of the cookie
        secure: config.NODE_ENV !== 'development'
      })
    );
    /**
     * automatically protect your application against HPP attacks by checking incoming requests for multiple values for the same parameter and removing any that are found.
     */
    app.use(hpp());
    /**
     * secure your application from various types of attacks,
     * including cross-site scripting (XSS), cross-site request forgery (CSRF), clickjacking, and other security threats.
     * This will set a number of security-related HTTP headers in your application, including X-XSS-Protection, X-Content-Type-Options, X-Frame-Options, and others.
     */
    app.use(helmet());
    /**
     * This will set the appropriate CORS headers in your application, so that web browsers can make cross-domain requests to your application.
     */
    app.use(
      cors({
        origin: config.CLIENT_URL,
        credentials: true, //to use cookie
        optionsSuccessStatus: 200,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
      })
    );
  }

  private standardMiddleware(app: Application): void {
    //help to compress response
    app.use(compression());
    /**
     * used to parse JSON data in the request body
     * You can access the parsed JSON data in the request body via the req.body property.
     * for POST, not exceed 50mb
     */
    app.use(
      json({
        limit: '50mb'
      })
    );
    // configures the body-parser middleware to parse URL-encoded data. allow encode data to json both front and back
    // for GET
    app.use(
      urlencoded({
        extended: true,
        limit: '50mb'
      })
    );
  }

  private routeMiddleware(app: Application): void {
    applicationRoutes(app);
  }

  private globalErrorHandler(app: Application): void {
    // handle url not exits
    // difference between app.use and app.all,https://cloud.tencent.com/developer/article/1653833
    /**
     * endpoint-specific middleware functions (e.g., app.get(...), app.post(...)) will be executed before catch-all middleware functions (e.g., app.all(...)) if a match is found.
     * If no match is found, the catch-all middleware functions will be executed.
     * For example:
        * app.use(middleware1);
        * app.use(middleware2);
        * app.get('/users', middleware3);
        * app.all('*', catchAllMiddleware);
     * When a client makes a GET request to the /users endpoint, the execution order of the middleware functions will be:
        * middleware1
        * middleware2
        * middleware3
     * catchAllMiddleware will not be executed, as the request was handled by middleware3.
     * If the client makes a request to an endpoint that is not handled by any other middleware functions, the execution order will be:
        * middleware1
        * middleware2
        * catchAllMiddleware
     */
    app.all('*', (req: Request, res: Response) => {
      res.status(HTTP_STATUS.NOT_FOUND).json({ message: `${req.originalUrl} not found` });
    });

    /**
     * Error-handling middleware functions, catch and handle errors that occur during the processing of incoming requests.
     * They are typically the last middleware functions in the pipeline and are executed after all other middleware functions have been executed.
     * and are executed only if an error occurred during the processing of the request.
     */
    app.use((error: IErrorResponse, req: Request, res: Response, next: NextFunction) => {
      log.error(error);
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json(error.serializeErrors());
      }
      next();
    });
  }

  //async method always return Promise<>
  private async startServer(app: Application): Promise<void> {
    try {
      //use http.Server instead of import it in the beginning, because socketIO also have Server, there will be a confilct
      //use it in startHttpServer method
      const httpServer: http.Server = new http.Server(app);
      const socketIO: Server = await this.createSocketIO(httpServer);
      this.startHttpServer(httpServer);
      this.socketIOConnections(socketIO);
    } catch (error) {
      log.error(error);
    }
  }


  private async createSocketIO(httpServer: http.Server): Promise<Server> {
    //An instance of the Server class represents a socket.io server and can listen for incoming connections from clients
    /**
     * @param httpServer:  an instance of an http.Server object that the socket.io server should listen on.
     * @param options (optional): This is an object that contains options to configure the socket.io server.
     */
    const io: Server = new Server(httpServer, {
      cors: {
        origin: config.CLIENT_URL,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
      }
    });
    //creates a new Redis client instance
    const pubClient = createClient({ url: config.REDIS_HOST }); //for publish
    const subClient = pubClient.duplicate(); //for subscription
    //wait for all the promises to resolve
    await Promise.all([pubClient.connect(), subClient.connect()]);

    //create a Redis adapter, a component that allows you to use Redis as a data store for your application. The adapter acts as a bridge between the application and Redis, translating the data structures and commands between the two.
    //attaches the Redis adapter to the socket.io server using the adapter method. This allows socket.io to work with Redis as the back-end for storing data such as connected clients, rooms, and event history.
    io.adapter(createAdapter(pubClient, subClient));
    return io;
  }

  private startHttpServer(httpServer: http.Server): void {
    log.info(`Server has started with process ${process.pid}`);
    httpServer.listen(SERVER_PORT, () => {
      //not recommend to use console.log, recommend to use log library
      log.info(`Server running on port ${SERVER_PORT}`);
    });
  }

  private socketIOConnections(io: Server): void {
    const postSocketHandler: SocketIOPostHandler = new SocketIOPostHandler(io);
    postSocketHandler.listen();
  }
}
