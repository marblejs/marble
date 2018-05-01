import { Http } from '../http.interface';

export const loggerMiddleware = (http: Http) => {
  console.log('Logger:', `${http.req.url}`);
  return http;
};
