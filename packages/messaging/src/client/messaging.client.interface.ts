import { Event } from '@marblejs/core';
import { Observable } from 'rxjs';
import { TransportMessageTransformer, TransportStrategy } from '../transport/transport.interface';

export interface MessagingClient {
  send: <T extends Event = Event, U extends Event = Event>(data: U) => Observable<T>;
  emit: <T extends Event = Event>(data: T) => Promise<void>;
  close: () => Promise<void>;
}

type ConfigurationBase =  {
  msgTransformer?: TransportMessageTransformer;
}

export type MessagingClientConfig =
  & TransportStrategy
  & ConfigurationBase
  ;
