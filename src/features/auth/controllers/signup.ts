import { userQueue } from './../../../shared/services/queues/user.queue';
import { authQueue } from './../../../shared/services/queues/auth.queue';
import HTTP_STATUS from 'http-status-codes';
import { UploadApiResponse } from 'cloudinary';
import { Helpers } from '@global/helpers/helpers';
import { ObjectId } from 'mongodb';
import { BadRequestError } from '@global/helpers/error-handler';
import { authService } from '@service/db/auth.service';
import { IAuthDocument, ISignUpData } from './../interfaces/auth.interface';
import { signupSchema } from '@auth/schemes/signup';
import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { Request, Response } from 'express';
import { uploads } from '@global/helpers/cloudinary-upload';
import { IUserDocument } from '@user/interfaces/user.interface';
import { UserCache } from '@service/redis/user.cache';
import { omit } from 'lodash';
import JWT from 'jsonwebtoken';
import { config } from '@root/config';
//we want to generate user id by ourselves

const userCache: UserCache = new UserCache();

export class SignUp {
  //how to use joiValidation(Schema), create(req: Request, res: Response)里的参数对应descriptor.value = async function (...args:any[])
  @joiValidation(signupSchema)
  public async create(req: Request, res: Response): Promise<void> {
    const { username, email, password, avatarColor, avatarImage } = req.body;
    //check if username or email already exist
    const checkIfUserExist: IAuthDocument = await authService.getUserByUsernameOrEmail(username, email);
    if (checkIfUserExist) {
      throw new BadRequestError('Invalid credentials, username or email already exists');
    }
    //generate our own objectID
    const authObjectId: ObjectId = new ObjectId(); //used for IAuthDocument
    const userObjectId: ObjectId = new ObjectId(); //for image and _id in IUserDocument
    const uId = `${Helpers.generateRandomIntegers(12)}`;

    //the teacher use SignUp.prototype.signupData instead of this.signupData, 他说this.signupData will not work
    const authData: IAuthDocument = SignUp.prototype.signupData({
      _id: authObjectId,
      uId,
      username,
      email,
      password,
      avatarColor
    });

    const result: UploadApiResponse = (await uploads(avatarImage, `${userObjectId}`, true, true)) as UploadApiResponse;
    //会生成图片地址https://res.cloudinary.com/randomnumber/userObjectId,如果不给定userObjectId，cloudinary会每次更新图片就生成一个，如果给定，那更新的图片会覆盖之前userObjectId的图片

    //if error
    if (!result?.public_id) {
      throw new BadRequestError('File Image upload failed: try again.');
    }

    //Add to redis cache

    const userDataForCache: IUserDocument = SignUp.prototype.userData(authData, userObjectId);

    userDataForCache.profilePicture = `https://res.cloudinary.com/${process.env.CLOUD_NAME}/image/upload/v${result.version}/${userObjectId}`;
    await userCache.saveUserToCache(`${userObjectId}`, uId, userDataForCache);

    //Add to database
    //use omit() to delete properties in object
    omit(userDataForCache, ['uId', 'username', 'email', 'avatarColor', 'password']);
    authQueue.addAuthUserJob(authQueue.queueName, { value: userDataForCache });

    userQueue.addUserJob(userQueue.queueName, { value: userDataForCache });
    const userJwt: string = SignUp.prototype.signToken(authData, userObjectId);
    //add data to cookie session
    //every time when a request is made, if a user login, we will check if its session is a valid token, if it is valid, we will allow request to proceed
    req.session = { jwt: userJwt };
    // return response
    res.status(HTTP_STATUS.CREATED).json({
      message: 'User created successfully',
      user: userDataForCache,
      token: userJwt,
    });
  }

  //generate JWT token
  private signToken(data: IAuthDocument, userObjectId: ObjectId): string {
    return JWT.sign(
      {
        userId: userObjectId,
        uId: data.uId,
        email: data.email,
        username: data.username,
        avatarColor: data.avatarColor
      },
      config.JWT_TOKEN!
    );
  }

  private signupData(data: ISignUpData): IAuthDocument {
    const { _id, username, email, uId, password, avatarColor } = data;
    return {
      _id,
      uId,
      username: Helpers.firstLetterUppercase(username),
      email: Helpers.lowerCase(email),
      password,
      avatarColor,
      createdAt: new Date()
    } as IAuthDocument;
  }

  private userData(data: IAuthDocument, userObjectId: ObjectId): IUserDocument {
    const { _id, username, email, uId, password, avatarColor } = data;
    return {
      _id: userObjectId,
      authId: _id,
      username: Helpers.firstLetterUppercase(username),
      email: Helpers.lowerCase(email),
      password: password,
      avatarColor: avatarColor,
      uId: uId,
      postsCount: 0,
      work: '',
      school: '',
      quote: '',
      location: '',
      blocked: [],
      blockedBy: [],
      followersCount: 0,
      followingCount: 0,
      notifications: {
        messages: true,
        reactions: true,
        comments: true,
        follows: true
      },
      social: {
        facebook: '',
        instagram: '',
        twitter: '',
        youtube: ''
      },
      bgImageVersion: '',
      bgImageId: '',
      profilePicture: ''
    } as unknown as IUserDocument;
  }
}
