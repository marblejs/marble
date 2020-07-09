import { Observable, Subject } from 'rxjs';
import { createContextToken } from '../../context/context.token.factory';
import { HttpServer, HttpRequest } from '../http.interface';
import { AllServerEvents } from './http.server.event';

export const HttpServerEventStreamToken = createContextToken<Observable<AllServerEvents>>('HttpServerEventStreamToken');
export const HttpServerClientToken = createContextToken<HttpServer>('HttpServerClientToken');
export const HttpRequestBusToken = createContextToken<Subject<HttpRequest>>('HttpRequestBusToken');
