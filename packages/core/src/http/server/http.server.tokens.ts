import { Subject } from 'rxjs';
import { createContextToken } from '../../context/context.token.factory';
import { HttpServer, HttpRequest } from '../http.interface';

export const HttpServerClientToken = createContextToken<HttpServer>('HttpServerClientToken');
export const HttpRequestBusToken = createContextToken<Subject<HttpRequest>>('HttpRequestBusToken');
