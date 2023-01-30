import { authMiddleware } from './../../../shared/globals/helpers/auth-middleware';
import { SignOut } from './../controllers/signout';
import { SignIn } from './../controllers/signin';
import { SignUp } from '@auth/controllers/signup';
import express, { Router } from 'express';
import { CurrentUser } from '@auth/controllers/current-user';

class CurrentUserRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    //middleware 的用法
    this.router.get('/currentuser', authMiddleware.checkAuthentication, CurrentUser.prototype.read);
    return this.router;
  }
}

export const currentUserRoutes: CurrentUserRoutes = new CurrentUserRoutes();
