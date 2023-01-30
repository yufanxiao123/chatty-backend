import { authWorker } from './../../workers/auth.worker';
import { IAuthJob } from './../../../features/auth/interfaces/auth.interface';
import { BaseQueue } from './base.queue';
import { userWorker } from '@worker/user.worker';

class UserQueue extends BaseQueue {
  queueName: string;
  constructor() {
    super('user'); //name of the queue
    this.queueName = 'addUserToDB';
    //if there are any jobs in a queue, this process will process jobs
    this.processJob(this.queueName, 5, userWorker.addUserToDB);
  }

  public addUserJob(name: string, data: any): void {
    this.addJob(name, data);
  }
}

export const userQueue: UserQueue = new UserQueue();
