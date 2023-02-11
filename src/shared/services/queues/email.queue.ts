import { emailWorker } from './../../workers/email.worker';
import { IEmailJob } from './../../../features/user/interfaces/user.interface';
import { BaseQueue } from '@service/queues/base.queue';

class EmailQueue extends BaseQueue {
  queueName: string;
  constructor() {
    super('email'); //name of the queue
    this.queueName = 'forgotPasswordEmail';
    //if there are any jobs in a queue, this process will process jobs
    //'addAuthUserToDB'与signup.ts中authQueue.addAuthUserJob('addAuthUserToDB',{value: userDataForCache})中相同
    this.processJob(this.queueName, 5, emailWorker.addNotificationEmail);
  }

  public addEmailJob(name: string, data: IEmailJob): void {
    this.addJob(name, data);
  }
}

export const emailQueue: EmailQueue = new EmailQueue();
