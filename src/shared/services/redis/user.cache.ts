import { IUserDocument } from '@user/interfaces/user.interface';
import { BaseCache } from '@service/redis/base.cache';
import { config } from '@root/config';
import Logger from 'bunyan';
import { ServerError } from '@global/helpers/error-handler';
import { Helpers } from '@global/helpers/helpers';

const userCacheName = 'userCache';
const log: Logger = config.createLogger(userCacheName);

export class UserCache extends BaseCache {
  constructor() {
    super(userCacheName);
  }
  //save user data object in sorted set
  /***
   * key is something like we use to get user in cache, 在Signup.ts里是userObjectId，和传照片给cloudinary的id一样
   */
  public async saveUserToCache(key: string, userUId: string, createdUser: IUserDocument): Promise<void> {
    const createdAt = new Date();
    const {
      _id,
      authId,
      username,
      email,
      password,
      avatarColor,
      uId,
      postsCount,
      work,
      school,
      quote,
      location,
      blocked,
      blockedBy,
      followersCount,
      followingCount,
      notifications,
      social,
      bgImageVersion,
      bgImageId,
      profilePicture
    } = createdUser;

    const firstList: string[] = [
      '_id',
      `${_id}`,
      'uId',
      `${uId}`,
      'username',
      `${username}`,
      'email',
      `${email}`,
      'avatarColor',
      `${avatarColor}`,
      'createdAt',
      `${createdAt}`,
      'postsCount',
      `${postsCount}`
    ];

    const secondList: string[] = [
      'blocked',
      JSON.stringify(blocked),
      'blockedBy',
      JSON.stringify(blockedBy),
      'profilePicture',
      `${profilePicture}`,
      'followersCount',
      `${followersCount}`,
      'followingCount',
      `${followingCount}`,
      'notifications',
      JSON.stringify(notifications),
      'social',
      JSON.stringify(social)
    ];

    const thirdList: string[] = [
      'work',
      `${work}`,
      'school',
      `${school}`,
      'quote',
      `${quote}`,
      'location',
      `${location}`,
      'bgImageVersion',
      `${bgImageVersion}`,
      'bgImageId',
      `${bgImageId}`
    ];

    const dataToSave: string[] = [...firstList, ...secondList, ...thirdList];

    try {
      //check if connect is open
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      /***
       * Redis Zadd 命令用于将一个或多个成员元素及其分数值加入到有序集当中。
       * redis Zadd 命令基本语法如下：
       * ZADD KEY_NAME SCORE1 VALUE1, 此处，'user'是key，即这个sorted set的名字， 将userId转为int作为score， value是函数的参数key
       */
      await this.client.ZADD('user', { score: parseInt(userUId, 10), value: `${key}` });
      /***
       * redis Hset 命令基本语法如下：HSET KEY_NAME FIELD VALUE, KEY_NAME是该Hashes表的名字，`users:${key}`是字段，相当于java里map的key
       */
      await this.client.HSET(`users:${key}`, dataToSave);
      //至此，就完成了把user的信息存到Redis里
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getUserFromCache(key: string): Promise<IUserDocument | null> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      //get total hash in redis
      const response: IUserDocument = (await this.client.HGETALL(`users:${key}`)) as unknown as IUserDocument;
      //把所有不是string的property变成原来的样子
      response.createdAt = new Date(Helpers.parseJson(`${response.createdAt}`));
      response.postsCount = Helpers.parseJson(`${response.postsCount}`);
      response.blocked = Helpers.parseJson(`${response.blocked}`);
      response.blockedBy = Helpers.parseJson(`${response.blockedBy}`);
      response.notifications = Helpers.parseJson(`${response.notifications}`);
      response.social = Helpers.parseJson(`${response.social}`);
      response.followersCount = Helpers.parseJson(`${response.followersCount}`);
      response.followingCount = Helpers.parseJson(`${response.followingCount}`);
      return response;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }
}
