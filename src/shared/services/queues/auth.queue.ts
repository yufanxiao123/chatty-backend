import { authWorker } from './../../workers/auth.worker';
import { IAuthJob } from './../../../features/auth/interfaces/auth.interface';
import { BaseQueue } from './base.queue';

class AuthQueue extends BaseQueue {
  queueName: string;
  constructor() {
    super('auth'); //name of the queue
    this.queueName = 'addAuthUserToDB';
    //if there are any jobs in a queue, this process will process jobs
    //'addAuthUserToDB'与signup.ts中authQueue.addAuthUserJob('addAuthUserToDB',{value: userDataForCache})中相同
    this.processJob(this.queueName, 5, authWorker.addAuthUserToDB);
  }

  public addAuthUserJob(name: string, data: IAuthJob): void {
    this.addJob(name, data);
  }
}

export const authQueue: AuthQueue = new AuthQueue();
