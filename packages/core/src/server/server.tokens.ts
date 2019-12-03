import { Observable } from 'rxjs';
import { AllServerEvents } from './server.event';
import { createContextToken } from '../context/context.token.factory';
import { HttpServer } from '../http.interface';
import { Routing } from '../router/router.helpers';

export const ServerEventStreamToken = createContextToken<Observable<AllServerEvents>>('ServerEventStreamToken');
export const ServerClientToken = createContextToken<HttpServer>('ServerClientToken');
export const ServerRoutingToken = createContextToken<Routing>('ServerRoutingToken');
