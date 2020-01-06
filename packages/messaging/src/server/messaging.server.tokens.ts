import { createContextToken } from '@marblejs/core';
import { Subject } from 'rxjs';
import { TransportLayer } from '../transport/transport.interface';
import { AllServerEvents } from './messaging.server.events';
import { Logger } from './messaging.server.logger';

export const TransportLayerToken = createContextToken<TransportLayer>();
export const ServerEventsToken = createContextToken<Subject<AllServerEvents>>();
export const LoggerToken = createContextToken<Logger>();
