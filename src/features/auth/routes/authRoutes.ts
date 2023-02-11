import { Password } from './../controllers/password';
import { SignOut } from './../controllers/signout';
import { SignIn } from './../controllers/signin';
import { SignUp } from '@auth/controllers/signup';
import express, { Router } from 'express';

class AuthRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    //set a post route and give it controller function (Request handler)
    this.router.post('/signup', SignUp.prototype.create);
    this.router.post('/signin', SignIn.prototype.read);
    this.router.post('/forgot-password', Password.prototype.create);
    this.router.post('/reset-password/:token', Password.prototype.update);
    return this.router;
  }

  //写另一个函数的原因是，如果要sign out，必须要先sign in， 在sign out之前会需要一些validation form
  public signoutRoute(): Router {
    this.router.get('/signout', SignOut.prototype.update);
    return this.router;
  }
}

export const authRoutes: AuthRoutes = new AuthRoutes();
