import { IQueryComplete, IQueryDeleted } from './../../../features/post/interfaces/post.interface';
import { IUserDocument } from '@user/interfaces/user.interface';
import { IGetPostsQuery, IPostDocument } from '@post/interfaces/post.interface';
import { PostModel } from '@post/models/post.schema';
import { Query, UpdateQuery } from 'mongoose';
import { UserModel } from '@user/models/user.schema';

class PostService {
  public async addPostToDB(userId: string, createdPost: IPostDocument): Promise<void> {
    //在这里可以用await，也可以返回Promise类型，然后最后用Promise.all
    const post: Promise<IPostDocument> = PostModel.create(createdPost);
    //get document by userId, increment 1 postsCount in user, $inc, an mongaDB operater
    const user: UpdateQuery<IUserDocument> = UserModel.updateOne({ _id: userId }, { $inc: { postsCount: 1 } });
    await Promise.all([post, user]);
  }

  /**
   * @param query to get data
   * @param skip for pagenation, the number to skip first n items
   * @param limit for pagenation, number of returned items
   * @param sort ascending order or descending order, string: order by this string column ,Record<K extends keyof any, T> :a type with a set of properties K of type T,
   */
  public async getPosts(query: IGetPostsQuery, skip = 0, limit = 0, sort: Record<string, 1 | -1>): Promise<IPostDocument[]> {
    let postQuery = {};
    if (query?.imgId && query?.gifUrl) {
      //return all document that imgId != '' or gitUrl != ''
      postQuery = { $or: [{ imgId: { $ne: '' } }, { gifUrl: { $ne: '' } }] };
    } else {
      postQuery = query;
    }

    const posts: IPostDocument[] = await PostModel.aggregate([{ $match: postQuery }, { $sort: sort }, { $skip: skip }, { $limit: limit }]);
    return posts;
  }

  /**
   * @returns the total number of posts in DB
   */
  public async postsCount(): Promise<number> {
    const count: number = await PostModel.find({}).countDocuments();
    return count;
  }

  public async deletePost(postId: string, userId: string): Promise<void> {
    const deletePost: Query<IQueryComplete & IQueryDeleted, IPostDocument> = PostModel.deleteOne({ _id: postId });
    //const deleteReaction =
    const decrementPostCount: UpdateQuery<IUserDocument> = UserModel.updateOne({ _id: userId }, { $inc: { postsCount: -1 } });
    await Promise.all([deletePost, decrementPostCount]);
  }
}

export const postService: PostService = new PostService();
