import { IAuthDocument } from '@auth/interfaces/auth.interface';
import { AuthModel } from '@auth/models/auth.schema';
import { Helpers } from '@global/helpers/helpers';

class AuthService {
  // create and save a new document in the database
  public async createAuthUser(data: IAuthDocument): Promise<void> {
    await AuthModel.create(data);
  }

  //set passwordRestToken in authUser
  public async updatePasswordToken(authId: string, token: string, tokenExpiration: number): Promise<void> {
    await AuthModel.updateOne(
      { _id: authId },
      {
        passwordResetToken: token,
        passwordResetExpires: tokenExpiration
      }
    );
  }

  public async getUserByUsernameOrEmail(username: string, email: string): Promise<IAuthDocument> {
    //get data from mongoDB
    //$or operator is used to perform logical OR operation on the array of two or more expressions and select or retrieve only those documents that match at least one of the given expression in the array.
    //{ $or: [ { Expression1 }, { Expression2 }, ..., { ExpressionN } ] }
    //query条件：database中username == Helpers.firstLetterUppercase(username) 或email=Helpers.lowerCase(email)的项目
    const query = {
      $or: [{ username: Helpers.firstLetterUppercase(username) }, { email: Helpers.lowerCase(email) }]
    };
    //as 是cast的关键词
    const user: IAuthDocument = (await AuthModel.findOne(query).exec()) as IAuthDocument;
    return user;
  }

  public async getAuthUserByUsername(username: string): Promise<IAuthDocument> {
    const query = { username: Helpers.firstLetterUppercase(username) };
    //as 是cast的关键词
    const user: IAuthDocument = (await AuthModel.findOne(query).exec()) as IAuthDocument;
    return user;
  }

  public async getAuthUserByEmail(email: string): Promise<IAuthDocument> {
    const query = { email: Helpers.lowerCase(email) };
    //as 是cast的关键词
    const user: IAuthDocument = (await AuthModel.findOne(query).exec()) as IAuthDocument;
    return user;
  }
  public async getAuthUserByPasswordToken(token: string): Promise<IAuthDocument> {
    // if number in passwordResetExpires>Date.now(), return the user, otherwise, return null
    //Date.now() returns the current time in milliseconds since the Unix epoch
    //$gt is a MongoDB query operator that stands for "greater than". It is used to find all documents in a collection where a specified field has a value greater than a specified value.
    const query = {
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    };
    //as 是cast的关键词
    const user: IAuthDocument = (await AuthModel.findOne(query).exec()) as IAuthDocument;
    return user;
  }
}

export const authService: AuthService = new AuthService();
