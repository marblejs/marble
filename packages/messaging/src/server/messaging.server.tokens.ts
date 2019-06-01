import { createContextToken } from '@marblejs/core';
import { TransportLayer } from '../transport/transport.interface';

export const TransportLayerToken = createContextToken<Promise<TransportLayer>>();
