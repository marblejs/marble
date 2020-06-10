import * as t from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import { identity, flow } from 'fp-ts/lib/function';
import { Event, EventWithPayload, EventWithoutPayload } from './event.interface';

type Payload =
  | t.TypeC<any>
  | t.TupleC<any>
  | t.ReadonlyArrayC<any>
  | t.ArrayC<any>
  | t.StringC
  | t.BooleanC
  | t.NumberC
  | t.UndefinedC
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
  }, 'EventSchema');

  const create = (payload?: any): Event => {
    const result = schema.decode({ type, payload });
    const reportError = flow(
      PathReporter.report,
      report => report.join(', '),
      report => new Error(report),
    );

    return pipe(
      schema.decode({ type, payload }),
      flow(E.fold(_ => { throw reportError(result) }, identity)),
    );
  }

  return { ...schema, create } as EventBuilderOutput<T, P>;
};
