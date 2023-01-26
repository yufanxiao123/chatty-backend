//install express in terminal at first
import e, { Application, json, urlencoded, Response, Request, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import cookieSession from 'cookie-session';
import HTTP_STATUS from 'http-status-codes';
import 'express-async-errors';
import compress from 'compression';
import compression from 'compression';
import { config } from './config';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import applicationRoutes from './routes';
import { CustomError, IErrorResponse } from './shared/global/helpers/error-handler';
import Logger from 'bunyan';

const SERVER_PORT = 5000;
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
    app.use(
      //571有教cookie的property
      cookieSession({
        name: 'session',
        keys: [config.SECRET_KEY_ONE!, config.SECRET_KEY_TWO!],
        maxAge: 24 * 7 * 3600000,
        secure: config.NODE_ENV !== 'development'
      })
    );
    //use default
    app.use(hpp());
    app.use(helmet());
    // call middleware in express
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
    //help to compress request and response
    app.use(compression());
    //json from front to back, from back to front not exceed 50mb
    app.use(
      json({
        limit: '50mb'
      })
    );
    // allow encode data to json both front and back
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
    app.all('*', (req: Request, res: Response) => {
      res.status(HTTP_STATUS.NOT_FOUND).json({ message: `${req.originalUrl} not found` });
    });

    //Each app.use(middleware) is called every time a request is sent to the server.
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
    const io: Server = new Server(httpServer, {
      cors: {
        origin: config.CLIENT_URL,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
      }
    });
    const pubClient = createClient({ url: config.REDIS_HOST }); //for publish
    const subClient = pubClient.duplicate(); //for subscription
    await Promise.all([pubClient.connect(), subClient.connect()]);
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
    log.info('calling socketIOConnections');
  }
}
