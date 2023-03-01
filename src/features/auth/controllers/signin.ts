import { resetPasswordTemplate } from './../../../shared/services/emails/templates/reset-password/reset-password-template';
import { emailQueue } from './../../../shared/services/queues/email.queue';
import { forgotPasswordTemplate } from './../../../shared/services/emails/templates/forgot-password/forgot-password-template';
import { userService } from './../../../shared/services/db/user.service';
import { IResetPasswordParams, IUserDocument } from '@user/interfaces/user.interface';

import HTTP_STATUS from 'http-status-codes';
import { BadRequestError } from '@global/helpers/error-handler';
import { authService } from '@service/db/auth.service';
import { IAuthDocument } from './../interfaces/auth.interface';
import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { Request, Response } from 'express';
import JWT from 'jsonwebtoken';
import { config } from '@root/config';
import { loginSchema } from '@auth/schemes/signin';
import { mailTransport } from '@service/emails/mail.transport';
import moment from 'moment';
import PublicIP from 'ip';
export class SignIn {
  @joiValidation(loginSchema)
  public async read(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body;

    const existingUser: IAuthDocument = await authService.getAuthUserByUsername(username);
    if (!existingUser) {
      throw new BadRequestError('Invalid credentials: cannot find username.');
    }

    const passwordMatch: boolean = await existingUser.comparePassword(password);
    if (!passwordMatch) {
      throw new BadRequestError('Invalid credentials: password is wrong.');
    }
    const user: IUserDocument = await userService.getUserByAuthId(`${existingUser._id}`);
    const userJwt: string = JWT.sign(
      {
        userId: user._id,
        uId: existingUser.uId,
        email: existingUser.email,
        username: existingUser.username,
        avatarColor: existingUser.avatarColor
      },
      config.JWT_TOKEN!
    );
    //cookie-session module带来的
    /**
     * In Express, a session is a way of storing user-specific data on the server that can be retrieved for each subsequent request made by the same user.
     * The session data is stored on the server, and a unique session ID is stored on the user's browser in a cookie.
     * When the user makes subsequent requests, the session ID is sent back to the server, allowing it to retrieve the associated session data.
     */
    req.session = { jwt: userJwt };

    //await mailTransport.sendEmail('hunter13@ethereal.email','Testing development','Testing development body');

    //...user表示包含了user里的所有
    const userDocument: IUserDocument = {
      ...user,
      authId: existingUser!._id,
      username: existingUser!.username,
      email: existingUser!.email,
      avatarColor: existingUser!.avatarColor,
      uId: existingUser!.uId,
      createdAt: existingUser!.createdAt
    } as IUserDocument;

    res.status(HTTP_STATUS.OK).json({
      message: 'User login successfully',
      user: userDocument,
      token: userJwt
    });
  }
}
