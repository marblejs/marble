import { Observable } from 'rxjs';
import { AllServerEvents } from './server.event';
import { createContextToken } from '../context/context.token.factory';

export const serverEvent$ = createContextToken<Observable<AllServerEvents>>();
