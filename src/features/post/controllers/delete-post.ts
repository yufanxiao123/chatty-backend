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
import { postService } from '@service/db/post.service';

const postCache: PostCache = new PostCache();

export class Delete {
  public async post(req: Request, res: Response) {
    socketIOPostObject.emit('delete post',req.params.postId);
    await postCache.deletePostFromCache(req.params.postId,`${req.currentUser!.userId}`);
    postQueue.addPostJob('deletePostFromDB',{keyOne:req.params.postId,keyTwo:`${req.currentUser!.userId}`});
    res.status(HTTP_STATUS.OK).json({
      message: 'Post deleted successfully'
    });
  }
}
