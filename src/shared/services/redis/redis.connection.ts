import { config } from '@root/config';
import Logger from 'bunyan';
import { BaseCache } from '@service/redis/base.cache';

const redisConnectionCacheName = 'redisConnection';
const log: Logger = config.createLogger(redisConnectionCacheName);

class RedisConnection extends BaseCache {
  constructor() {
    super(redisConnectionCacheName);
  }

  //https://www.npmjs.com/package/redis 连接方法
  async connect(): Promise<void> {
    try {
      await this.client.connect();
      //Redis Ping 命令使用客户端向 Redis 服务器发送一个 PING ，如果服务器运作正常的话，会返回一个 PONG 。通常用于测试与服务器的连接是否仍然生效，或者用于测量延迟值。
      const res = await this.client.ping();
      console.log(res);
      if (res == 'PONG') {
        log.info('redis successfully connected');
      }
    } catch (error) {
      log.error(error);
    }
  }
}

export const redisConnection: RedisConnection = new RedisConnection();
