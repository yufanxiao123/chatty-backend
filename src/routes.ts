import { Application } from 'express';

export default (app: Application) => {
  const routes = () => {
    console.log('calling routes()');
  };
  routes();
};
