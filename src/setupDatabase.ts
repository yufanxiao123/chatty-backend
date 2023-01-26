import Logger from 'bunyan';
import mongoose from 'mongoose';
import { config } from './config';

const log: Logger = config.createLogger('setupDatabase');

//use default means it is an annomyous fuction, when you import, you can use any name
export default () => {
  const connect = () => {
    mongoose
      .connect(`${config.DATABASE_URL}`)
      .then(() => {
        log.info('successfully connected to database');
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
