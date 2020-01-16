import * as M from 'fp-ts/lib/Map';
import * as A from 'fp-ts/lib/Array';
import { io } from 'fp-ts/lib/IO';
import { pipe } from 'fp-ts/lib/pipeable';
import { LoggerToken } from '../logger';
import { Context, lookup, ordContextToken } from './context.factory';
import { useContext } from './context.hook';
import { ContextToken } from './context.token.factory';

export const logContext = (tag: string) => (context: Context): Context => {
  const ask = lookup(context);
  const logger = useContext(LoggerToken)(ask);

  const log = (token: ContextToken) => logger({
    tag,
    type: 'Context',
    message: token.name
      ? `Registered: "${token.name}"`
      : `Registered unnamed token: ${token._id}`,
  });

  const logDependencies = A.array.sequence(io)(
    pipe(
      context,
      M.keys(ordContextToken),
      A.map(log),
    )
  );

  logDependencies();

  return context;
}
