import { postWorker } from './../../workers/post.worker';
import { IPostJobData } from '@post/interfaces/post.interface';
import { BaseQueue } from './base.queue';

class PostQueue extends BaseQueue {
  queueName: string;
  constructor() {
    super('post'); //name of the queue
    this.queueName = 'addPostToDB';

    this.processJob(this.queueName, 5, postWorker.savePostToDB);
    this.processJob('deletePostFromDB',5,postWorker.deletePostFromDB);
  }

  public addPostJob(name: string, data: IPostJobData): void {
    this.addJob(name, data);
  }

}

export const postQueue: PostQueue = new PostQueue();
