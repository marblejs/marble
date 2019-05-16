import { Observable } from 'rxjs';

export interface MessagingClient {
  emit: <T>(data: T) => Observable<any>;
  send: <T, U>(data: T) => Observable<U>;
  publish: <T>(data: T) => Observable<any>;
  close: () => Observable<any>;
}
