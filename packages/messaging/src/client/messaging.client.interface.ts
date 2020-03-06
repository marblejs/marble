import { Event } from '@marblejs/core';
import { Observable } from 'rxjs';
import { TransportMessageTransformer, TransportStrategy } from '../transport/transport.interface';

export interface MessagingClient {
  send: <T = Event, U = Event>(data: U) => Observable<T>;
  emit: <T = Event>(data: T) => Promise<void>;
  close: () => Promise<void>;
}

type ConfigurationBase =  {
  msgTransformer?: TransportMessageTransformer<any>;
}

export type MessagingClientConfig =
  & TransportStrategy
  & ConfigurationBase
  ;
