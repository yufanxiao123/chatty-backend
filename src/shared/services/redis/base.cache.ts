import { config } from '@root/config';
import Logger from 'bunyan';
import { createClient } from 'redis';

/***
 * createClient is a function, ReturnType<Type> Constructs a type consisting of the return type of function Type
 * TypeScript adds a typeof operator you can use in a type context to refer to the type of a variable or property:
 * 这里就是把createClient函数的返回类型命名为RedisClient
 */
export type RedisClient = ReturnType<typeof createClient>;

export abstract class BaseCache {
  client: RedisClient;
  log: Logger;

  /***
   * cacheName is used to name logger, so that we can know where error come from
   */
  constructor(cacheName: string) {
    this.client = createClient({ url: config.REDIS_HOST });
    this.log = config.createLogger(cacheName);
    this.cacheError();
  }

  private cacheError(): void {
    this.client.on('error', (err: unknown) => {
      this.log.error(err);
    });
  }
}
