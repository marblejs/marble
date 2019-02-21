import * as http from 'http';
import { createContextToken } from '../context/context.token.factory';

export const httpServerToken = createContextToken<http.Server>();
