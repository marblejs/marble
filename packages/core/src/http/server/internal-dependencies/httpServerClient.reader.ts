import { createReader } from '../../../context/context.reader.factory';
import { createContextToken } from '../../../context/context.token.factory';
import { HttpServer } from '../../http.interface';
import { HttpRequestBus } from './httpRequestBus.reader';

export type HttpServerClient = ReturnType<typeof HttpRequestBus>;

export const HttpServerClientToken = createContextToken<HttpServer>('HttpServerClient');

export const HttpServerClient = (httpServer: HttpServer) => createReader(_ => httpServer);
