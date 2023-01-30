import { IAuthJob } from '@auth/interfaces/auth.interface';
import { BullAdapter, createBullBoard, ExpressAdapter } from '@bull-board/express';
import { config } from '@root/config';
import Queue, { Job } from 'bull';
import Logger from 'bunyan';

type IBaseJobData = IAuthJob;

let bullAdapter: BullAdapter[] = [];

export let serverAdapter: ExpressAdapter;

export abstract class BaseQueue {
  queue: Queue.Queue;
  log: Logger;

  constructor(queueName: string) {
    this.queue = new Queue(queueName, `${config.REDIS_HOST}`);
    //for every queue created, push it to bullAdapter
    bullAdapter.push(new BullAdapter(this.queue));
    //use Set() to remove duplicate queue in bullAdapter
    bullAdapter = [...new Set(bullAdapter)];
    serverAdapter = new ExpressAdapter();
    //see queue ui when development
    serverAdapter.setBasePath('/queues');

    createBullBoard({
      queues: bullAdapter,
      serverAdapter
    });

    this.log = config.createLogger(`${queueName} Queue`);

    //listen to some events, 第一个参数是给定有几个可选的，不能自己创造
    this.queue.on('completed', (job: Job) => {
      this.log.info(`Job ${job.id} completed.`);
      job.remove();
    });

    this.queue.on('global:completed', (jobId: string) => {
      this.log.info(`Global Job ${jobId} completed.`);
    });

    this.queue.on('global:stalled', (jobId: string) => {
      this.log.info(`Global Job ${jobId} stalled.`);
    });
  }

  protected addJob(name: string, data: IBaseJobData): void {
    //how many times to attempt to add job into queue if it falis, delay: how many millionsecond wait before retry
    this.queue.add(name, data, { attempts: 3, backoff: { type: 'fixed', delay: 5000 } });
  }

  //how many jobs we want to process in a queue in a given time
  protected processJob(name: string, concurrency: number, callback: Queue.ProcessCallbackFunction<void>): void {
    this.queue.process(name, concurrency, callback);
  }
}
