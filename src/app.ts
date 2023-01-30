import express, { Express } from 'express';
import { ChattyServer } from '@root/setupServer';
import databaseConnection from '@root/setupDatabase';
import { config } from '@root/config';
//this class has nothing to do with Application class in express
//this file is the entry file for application
// to run locally, should: npm i -g nodemon
class Application {
  public initialize(): void {
    this.loadConfig();
    databaseConnection(); //default function in ./setupDatabase
    const app: Express = express();
    const server: ChattyServer = new ChattyServer(app);
    server.start();
  }

  private loadConfig(): void {
    config.validateConfig();
    config.cloudinaryConfig();
  }
}

const application: Application = new Application();
application.initialize();
