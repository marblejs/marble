import { Observable } from 'rxjs';
import { TransportMessageTransformer, TransportStrategy } from '../transport/transport.interface';

export interface MessagingClient {
  send: <T, U>(data: T) => Observable<U>;
  emit: <T>(data: T) => Promise<void>;
  close: () => Promise<void>;
}

type ConfigurationBase =  {
  msgTransformer?: TransportMessageTransformer<any>;
}

export type MessagingClientConfig =
  & TransportStrategy
  & ConfigurationBase
  ;
