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

const postCache = new PostCache();
const PAGE_SIZE = 10;

export class Get {
  //get all posts
  public async posts(req: Request, res: Response): Promise<void> {
    const {page} = req.params;
    const skip: number = (parseInt(page)-1)*PAGE_SIZE;
    const limit: number = PAGE_SIZE * parseInt(page);
    //newSkip for get data from redis, corresponding to start in getPostsFromCache(key,start,end)
    const newSkip: number = skip === 0? skip : skip+1;
    let posts: IPostDocument[] = [];
    let totalPosts = 0;
    const cachedPosts: IPostDocument[] = await postCache.getPostsFromCache('post',newSkip,limit);
    if (cachedPosts.length) {
      posts = cachedPosts;
      totalPosts = await postCache.getTotalPostsInCache();
    } else {
      posts = await postService.getPosts({},skip,limit,{createdAt:-1});
      totalPosts = await postService.postsCount();
    }
    res.status(HTTP_STATUS.OK).json({message:'All posts', posts: posts, totalPosts: totalPosts});
  }

  //return all posts with images
  public async postsWithImages(req: Request, res: Response): Promise<void> {
    const {page} = req.params;
    const skip: number = (parseInt(page)-1)*PAGE_SIZE;
    const limit: number = PAGE_SIZE * parseInt(page);
    //newSkip for get data from redis, corresponding to start in getPostsFromCache(key,start,end)
    const newSkip: number = skip === 0? skip : skip+1;
    let posts: IPostDocument[] = [];
    const cachedPosts: IPostDocument[] = await postCache.getPostsWithImagesFromCache('post',newSkip,limit);
    posts = cachedPosts.length ? cachedPosts: await postService.getPosts({imgId: '$ne',gifUrl:'$ne'},skip,limit,{createdAt:-1});

    res.status(HTTP_STATUS.OK).json({message:'All posts with images', posts: posts});
  }
}
