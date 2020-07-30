import { Subject } from 'rxjs';
import { HttpRequest } from '../../http.interface';
import { createContextToken } from '../../../context/context.token.factory';
import { createReader } from '../../../context/context.reader.factory';

export type HttpRequestBus = ReturnType<typeof HttpRequestBus>;

export const HttpRequestBusToken = createContextToken<HttpRequestBus>('HttpRequestBus');

export const HttpRequestBus = createReader(_ => new Subject<HttpRequest>());
