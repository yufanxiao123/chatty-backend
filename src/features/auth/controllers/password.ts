import { resetPasswordTemplate } from './../../../shared/services/emails/templates/reset-password/reset-password-template';
import { emailQueue } from './../../../shared/services/queues/email.queue';
import { forgotPasswordTemplate } from './../../../shared/services/emails/templates/forgot-password/forgot-password-template';
import { IResetPasswordParams } from '@user/interfaces/user.interface';
import HTTP_STATUS from 'http-status-codes';
import { BadRequestError } from '@global/helpers/error-handler';
import { authService } from '@service/db/auth.service';
import { IAuthDocument } from './../interfaces/auth.interface';
import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { Request, Response } from 'express';
import { config } from '@root/config';
import moment from 'moment';
import PublicIP from 'ip';
import { emailSchema, passwordSchema } from '@auth/schemes/password';
import crypto from 'crypto';

export class Password {
  //send reset password email to user
  @joiValidation(emailSchema)
  public async create(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    const existingUser: IAuthDocument = await authService.getAuthUserByEmail(email);
    if (!existingUser) {
      throw new BadRequestError('Invalid credentials: cannot find User with this email.');
    }

    //create a buffer
    const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
    //convert buffer to string, for reset password token
    const randomCharacters = randomBytes.toString('hex');

    await authService.updatePasswordToken(`${existingUser._id}`, randomCharacters, Date.now() * 60 * 60 * 1000);
    //create a reset link
    const resetLink = `${config.CLIENT_URL}/reset-password?token=${randomCharacters}`;
    const template: string = forgotPasswordTemplate.passwordResetTemplate(existingUser.username, resetLink);
    emailQueue.addEmailJob(emailQueue.queueName, { template, receiverEmail: email, subject: 'Reset your password' });

    res.status(HTTP_STATUS.OK).json({ message: 'Password reset email sent.' });
  }

  //send reset password comfirmation email to user
  @joiValidation(passwordSchema)
  public async update(req: Request, res: Response): Promise<void> {
    const { password, confirmPassword } = req.body;
    const { token } = req.params;
    // check if token exist or toekn expired
    const existingUser: IAuthDocument = await authService.getAuthUserByPasswordToken(token);
    if (!existingUser) {
      throw new BadRequestError('Reset token is wrong or expired.');
    }

    existingUser.password = password;
    existingUser.passwordResetExpires = undefined;
    existingUser.passwordResetToken = undefined;
    // save() is a method defined in Document from MongoDB
    await existingUser.save();

    //create a reset link
    const templateParams: IResetPasswordParams = {
      username: existingUser.username,
      email: existingUser.email,
      ipaddress: PublicIP.address(),
      date: moment().format('DD/MM/YYYY HH:mm')
    };
    const template: string = resetPasswordTemplate.passwordResetComfirmationTemplate(templateParams);
    emailQueue.addEmailJob(emailQueue.queueName, { template, receiverEmail: existingUser.email, subject: 'Password reset comfirmation' });
    res.status(HTTP_STATUS.OK).json({ message: 'Password reset confirmation email sent.' });
  }
}
