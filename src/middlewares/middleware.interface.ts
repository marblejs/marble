import { Http } from '../http.interface';

export type Middleware = (http: Http) => Http;
