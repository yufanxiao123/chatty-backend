import Logger from 'bunyan';
import mongoose from 'mongoose';
import { config } from '@root/config';
import { redisConnection } from '@service/redis/redis.connection';

const log: Logger = config.createLogger('setupDatabase');

//use default means it is an annomyous fuction, when you import, you can use any name
export default () => {
  const connect = () => {
    //connect MongDBdatabase
    mongoose
      .connect(`${config.DATABASE_URL}`)
      .then(() => {
        log.info('successfully connected to database');
        //connect redis
        redisConnection.connect();
      })
      .catch((err) => {
        log.error('error in connecting database', err);
        return process.exit(1);
      });
  };

  connect();
  //if disconnected, connect again
  mongoose.connection.on('disconnected', connect);
};
