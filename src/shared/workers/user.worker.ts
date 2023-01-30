import { userService } from '@service/db/user.service';
import { config } from '@root/config';
import { Job, DoneCallback } from 'bull';
import Logger from 'bunyan';

const log: Logger = config.createLogger('userWorker');

class UserWorker {
  async addUserToDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      //in controller signup.ts, we have authQueue.addAuthUserJob('addAuthUserToDB',{value: userDataForCache});
      const { value } = job.data;
      //add method to send data to database
      await userService.addUserData(value);
      //report job progress
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }
}

export const userWorker: UserWorker = new UserWorker();
