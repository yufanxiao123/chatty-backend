import { IEmailJob } from './../../../features/user/interfaces/user.interface';
import { IAuthJob } from '@auth/interfaces/auth.interface';
import { BullAdapter, createBullBoard, ExpressAdapter } from '@bull-board/express';
import { config } from '@root/config';
import Queue, { Job } from 'bull';
import Logger from 'bunyan';
import { IPostJobData } from '@post/interfaces/post.interface';

type IBaseJobData = IAuthJob | IEmailJob | IPostJobData;

let bullAdapter: BullAdapter[] = [];

export let serverAdapter: ExpressAdapter; // global variable for queue route,即只要有一个queue就会有这个serverAdapter

export abstract class BaseQueue {
  queue: Queue.Queue;
  log: Logger;

  constructor(queueName: string) {
    this.queue = new Queue(queueName, `${config.REDIS_HOST}`);
    //for every queue created, push it to bullAdapter
    //use Set() to remove duplicate queue in bullAdapter
    //By creating a new Set from the array and then immediately creating a new array from the Set, you are effectively removing any duplicates from the original array.
    //[...] is known as the spread operator in JavaScript. It allows you to spread the elements of an array, or the properties of an object, into a new array or a new object.
    bullAdapter.push(new BullAdapter(this.queue));
    bullAdapter = [...new Set(bullAdapter)];
    //see queue ui when development
    //The ExpressAdapter in bull-board/express is an adapter for the bull-board package that allows you to use it with the express framework in Node.js.
    //You can use it to mount the bull-board UI at a specific route in your express app, and configure the options that determine how the UI behaves.
    serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/queues');

    /**
     * @param queues: an array of bull queues that you want to monitor and manage through the bull-board UI. The queues option is set to bullAdapter, which is an array of bull queues.
     * @param serverAdapter: an adapter that is used to integrate the bull-board UI with a web server. The serverAdapter option is set to serverAdapter, which is an instance of an adapter (e.g., ExpressAdapter or HapiAdapter) that has been created earlier.
     */
    createBullBoard({
      queues: bullAdapter,
      serverAdapter
    });

    this.log = config.createLogger(`${queueName} Queue`);

    //listen to some events, 第一个参数是给定有几个可选的，不能自己创造
    // the on method of the queue object is used to register event listeners for various events that can occur in the queue.
    /**
     * @param: the name of the event to listen for
     * @param: a callback function that will be called when the event occurs.
     *  find a complete list of events in the bull documentation.
     */
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
    /**
     * @param: a string that represents the type of job that you are adding to the queue. This can be any string that makes sense for your application.
     * @param:  an object that represents the data that you want to pass to the job. This can be any JavaScript value that can be serialized to JSON.
     * @param:  an options object
     * attempts: Specifies the number of times the job should be attempted before it is considered failed
     * backoff: Specifies the backoff strategy to use for the job. In this example, a fixed backoff strategy is being used, with a delay of 5000 milliseconds (5 seconds) between each attempt.
     * The job will be processed by a worker at some point in the future, depending on the state of the queue and the available workers.
     */
    this.queue.add(name, data, { attempts: 3, backoff: { type: 'fixed', delay: 5000 } });
  }

  //how many jobs we want to process in a queue in a given time
  //The process method in bull is used to define how jobs in the queue should be processed. It sets up a worker that listens for jobs in the queue and processes them as they become available.
  protected processJob(name: string, concurrency: number, callback: Queue.ProcessCallbackFunction<void>): void {
    /**
     * @param: The name of the job type that you want to process. In this example, the worker will only process jobs with the specified name.
     * @param: concurrency: The number of jobs that the worker should process concurrently
     * @param: callback: A function that defines what should happen when a job is received.
     * The process method sets up a worker that listens for jobs in the queue with the specified name, and when a job becomes available, it is passed to the callback function for processing. The worker will process up to concurrency jobs at the same time.
     * You can call the process method multiple times to set up multiple workers for different job types, or to process jobs with the same type at different concurrency levels.
     */
    this.queue.process(name, concurrency, callback);
  }
}
