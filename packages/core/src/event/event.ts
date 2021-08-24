import * as t from 'io-ts';
import { Event, EventWithPayload, EventWithoutPayload } from './event.interface';

type Payload =
  | t.TypeC<any>
  | t.TupleC<any>
  | t.UnionC<any>
  | t.ReadonlyC<any>
  | t.ReadonlyArrayC<any>
  | t.UnknownC
  | t.ArrayC<any>
  | t.StringC
  | t.BigIntC
  | t.BooleanC
  | t.BrandC<any, any>
  | t.NumberC
  | t.NullC
  | t.UnionC<any>
  | t.UndefinedC
  | t.PartialC<any>
  | t.BrandC<any, any>
  | t.RecordC<any, any>
  | t.IntersectionC<any>
  | t.ExactC<any>
  | t.UnknownRecordC
  | t.StringC
  | t.LiteralC<any>
  | t.KeyofC<any>
  ;

export type EventCodec =
  | EventSchemaWithPayload<any, any>
  | EventSchema<any>
  ;

export type EventSchema<T extends string> =
  t.TypeC<{ type: t.LiteralC<T>; payload: t.UndefinedC }>

export type EventSchemaWithPayload<T extends string, P extends Payload> =
  t.TypeC<{ type: t.LiteralC<T>; payload: P }>

type EventCreator<T extends string> =
  () => EventWithoutPayload<T>

type EventCreatorWithPayload<T extends string, P extends Payload> =
  (payload: t.TypeOf<P>) => EventWithPayload<t.TypeOf<P>, T>

type EventBuilderOutput<T extends string, P extends Payload | undefined> =
  undefined extends P
    ? EventSchema<T> & { create: EventCreator<T> }
    : EventSchemaWithPayload<T, NonNullable<P>> & { create: EventCreatorWithPayload<T, NonNullable<P>> }

export const EVENT_CODEC_NAME = 'EventSchema';

export const isEventCodec = (codec: any): codec is EventCodec =>
  codec.name === EVENT_CODEC_NAME;

/**
 * Creates an Event codec for decoding and creating I/O events.
 * @since v3.3.0
 * @example
 *
 * const CreateUser = event('CREATE_USER')(t.type({
 *   name: t.string,
 *   age: t.number,
 * }));
 *
 * CreateUser.create({
 *   name: 'Bob',
 *   age: 21,
 * });
 */
export const event = <T extends string>(type: T) => <P extends Payload | undefined>(payload?: P): EventBuilderOutput<T, P> => {
  const schema = t.type({
    type: t.literal(type),
    payload: payload ?? t.undefined,
  }, EVENT_CODEC_NAME);

  const create = (payload?: any): Event =>
    schema.encode({ type, payload });

  return { ...schema, create } as EventBuilderOutput<T, P>;
};
