import { createContextToken } from '@marblejs/core';
import { Subject } from 'rxjs';
import { TransportLayer } from '../transport/transport.interface';
import { AllServerEvents } from './messaging.server.events';

export const TransportLayerToken = createContextToken<TransportLayer>('TransportLayerToken');
export const ServerEventsToken = createContextToken<Subject<AllServerEvents>>('ServerEventsToken');
