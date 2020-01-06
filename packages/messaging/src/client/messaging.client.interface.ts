import { Observable } from 'rxjs';
import { TransportMessageTransformer, TransportStrategy } from '../transport/transport.interface';

export interface MessagingClient {
  emit: <T>(data: T) => Observable<boolean>;
  send: <T, U>(data: T) => Observable<U>;
  close: () => Observable<any>;
}

type ConfigurationBase =  {
  msgTransformer?: TransportMessageTransformer<any>;
}

export type MessagingClientConfig =
  & TransportStrategy
  & ConfigurationBase
  ;
