import { createContextToken } from '../../context/context.token.factory';
import { HttpServer } from '../http.interface';

export const HttpServerClientToken = createContextToken<HttpServer>('HttpServerClientToken');
