import { Observable, Subject } from 'rxjs';
import { createContextToken } from '../../context/context.token.factory';
import { HttpServer, HttpRequest } from '../http.interface';
import { Routing } from '../router/http.router.interface';
import { AllServerEvents } from './http.server.event';
import { HttpRequestMetadataStorage } from './http.server.metadata.storage';

export const HttpServerEventStreamToken = createContextToken<Observable<AllServerEvents>>('HttpServerEventStreamToken');
export const HttpServerClientToken = createContextToken<HttpServer>('HttpServerClientToken');
export const HttpRoutingToken = createContextToken<Routing>('HttpServerRoutingToken');
export const HttpRequestMetadataStorageToken = createContextToken<HttpRequestMetadataStorage>('HttpServerRequestMetadataStorageToken');
export const HttpRequestBusToken = createContextToken<Subject<HttpRequest>>('HttpRequestBusToken');
