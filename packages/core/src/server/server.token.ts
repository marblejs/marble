import * as http from 'http';
import { createInjectionToken } from './server.injector';

export const httpServerToken = createInjectionToken<http.Server>();
