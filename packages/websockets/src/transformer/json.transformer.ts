import { EventTransformer } from './transformer.inteface';

export const jsonTransformer: EventTransformer<string> = {
  decode: event => JSON.parse(event),
  encode: event => JSON.stringify(event),
};
