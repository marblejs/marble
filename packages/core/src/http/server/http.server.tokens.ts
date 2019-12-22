import { Observable } from 'rxjs';
import { createContextToken } from '../../context/context.token.factory';
import { HttpServer } from '../http.interface';
import { Routing } from '../router/http.router.helpers';
import { AllServerEvents } from './http.server.event';
import { ServerRequestMetadataStorage } from './http.server.metadata.storage';

export const ServerEventStreamToken = createContextToken<Observable<AllServerEvents>>('ServerEventStreamToken');
export const ServerClientToken = createContextToken<HttpServer>('ServerClientToken');
export const ServerRoutingToken = createContextToken<Routing>('ServerRoutingToken');
export const ServerRequestMetadataStorageToken = createContextToken<ServerRequestMetadataStorage>('ServerRequestMetadataStorageToken');
