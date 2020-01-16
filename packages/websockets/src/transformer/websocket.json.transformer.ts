import { EventTransformer } from './websocket.transformer.interface';

export const jsonTransformer: EventTransformer<string> = {
  decode: event => JSON.parse(event),
  encode: event => JSON.stringify(event),
};
