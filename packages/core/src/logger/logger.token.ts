import { createContextToken } from '../context/context.token.factory';
import { Logger } from './logger.interface';

export const LoggerToken = createContextToken<Logger>('LoggerToken');
