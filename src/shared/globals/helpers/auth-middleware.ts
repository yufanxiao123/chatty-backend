import JWT from 'jsonwebtoken';
import { AuthPayload } from '@auth/interfaces/auth.interface';
import { NextFunction, Request, Response } from 'express';
import { NotAuthorizedError } from './error-handler';
import { config } from '@root/config';

export class AuthMiddleware {
  //verity token is valid
  //在setupServer里设置了token的时间24*7*3600000， 当token到期后会出现这种情况
  public verifyUser(req: Request, res: Response, next: NextFunction): void {
    if (!req.session?.jwt) {
      throw new NotAuthorizedError('Token is not available. Please login again.');
    }

    try {
      //返回用JWT.sign生成token时所用的对象
      const payload: AuthPayload = JWT.verify(req.session?.jwt, config.JWT_TOKEN!) as AuthPayload;
      req.currentUser = payload;
    } catch (error) {
      throw new NotAuthorizedError('Token is not available. Please login again.');
    }
    next();
  }

  //check currentUser exist in request
  //everytime after user login, use this method as middleware
  public checkAuthentication(req: Request, res: Response, next: NextFunction): void {
    if (!req.currentUser) {
      throw new NotAuthorizedError('No currentUser. Authentication is required to access this routen.');
    }
    next();
  }
}

export const authMiddleware: AuthMiddleware = new AuthMiddleware();
