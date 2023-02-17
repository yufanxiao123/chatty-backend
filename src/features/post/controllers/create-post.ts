import { postQueue } from './../../../shared/services/queues/post.queue';
import  HTTP_STATUS  from 'http-status-codes';
import { ObjectId } from 'mongodb';
import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { IPostDocument } from '@post/interfaces/post.interface';
import { postSchema, postWithImageSchema } from '@post/schemes/post.schemes';
import { Request, Response } from 'express';
import { PostCache } from '@service/redis/post.cache';
import { socketIOPostObject } from '@socket/post';
import { UploadApiResponse } from 'cloudinary';
import { uploads } from '@global/helpers/cloudinary-upload';
import { BadRequestError } from '@global/helpers/error-handler';

const postCache: PostCache = new PostCache();

export class Create {


  @joiValidation(postSchema)
  public async post(req: Request, res: Response): Promise<void> {
    const {post, bgColor, privacy, gifUrl, profilePicture, feelings} = req.body;
    const postObjectId: ObjectId = new ObjectId();
    const createdPost: IPostDocument = {
      _id: postObjectId,
      userId: req.currentUser!.userId,
      username: req.currentUser!.username,
      email: req.currentUser!.email,
      avatarColor: req.currentUser!.avatarColor,
      profilePicture,
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      commentsCount: 0,
      imgVersion: '',
      imgId: '',
      videoId: '',
      videoVersion: '',
      createdAt: new Date(),
      reactions: { like: 0, love: 0, happy: 0, sad: 0, wow: 0, angry: 0 }
    } as unknown as IPostDocument;

    //socketIO object emit event to client
    //写在前面是为了让客户端不必等数据真的存到DB和redis
    socketIOPostObject.emit('add post',createdPost);
    //save to cache
    await postCache.savePostToCache({
      key: postObjectId,
      currentUserId: `${req.currentUser!.userId}`,
      uId: `${req.currentUser!.uId}`,
      createdPost
    });
    //save to DB
    postQueue.addPostJob(postQueue.queueName,{
      key:req.currentUser!.userId,
      value:createdPost
    });
    res.status(HTTP_STATUS.CREATED).json({message: 'Post created successfully'});
  }

  @joiValidation(postWithImageSchema)
  public async postWithImage(req: Request, res: Response): Promise<void> {
    const {post, bgColor, privacy, gifUrl, profilePicture, feelings, image} = req.body;

    //allow cloudinary to generate image id
    const result: UploadApiResponse = (await uploads(image)) as UploadApiResponse;
    if (!result?.public_id) {
      throw new BadRequestError(`${result!.message}`);
    }

    const postObjectId: ObjectId = new ObjectId();
    const createdPost: IPostDocument = {
      _id: postObjectId,
      userId: req.currentUser!.userId,
      username: req.currentUser!.username,
      email: req.currentUser!.email,
      avatarColor: req.currentUser!.avatarColor,
      profilePicture,
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      commentsCount: 0,
      imgVersion: result.version.toString(),
      imgId: result.public_id,
      videoId: '',
      videoVersion: '',
      createdAt: new Date(),
      reactions: { like: 0, love: 0, happy: 0, sad: 0, wow: 0, angry: 0 }
    } as unknown as IPostDocument;

    //socketIO object emit event to client
    //写在前面是为了让客户端不必等数据真的存到DB和redis
    socketIOPostObject.emit('add post',createdPost);
    //save to cache
    await postCache.savePostToCache({
      key: postObjectId,
      currentUserId: `${req.currentUser!.userId}`,
      uId: `${req.currentUser!.uId}`,
      createdPost
    });
    //save to DB
    postQueue.addPostJob(postQueue.queueName,{
      key:req.currentUser!.userId,
      value:createdPost
    });
    //call image queue to add image to MongoDB
    res.status(HTTP_STATUS.CREATED).json({message: 'Post created with image successfully'});
  }
}
