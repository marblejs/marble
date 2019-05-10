import { EffectMetadata } from './effects.interface';
import { AsyncScheduler } from 'rxjs/internal/scheduler/AsyncScheduler';
import { SchedulerLike } from 'rxjs';
import { ContextProvider } from '../context/context.factory';

export const createEffectMetadata = <Scheduler extends SchedulerLike, Err extends Error, Initiator = any>(
  metadata: {
    ask: ContextProvider;
    scheduler?: Scheduler;
    error?: Err;
    initiator?: Initiator;
  },
): EffectMetadata<Err, Initiator> => ({
  ask: metadata.ask,
  scheduler: metadata.scheduler || AsyncScheduler as any,
  error: metadata.error,
  initiator: metadata.initiator,
});
