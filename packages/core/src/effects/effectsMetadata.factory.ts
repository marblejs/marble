import { EffectMetadata } from './effects.interface';
import { AsyncScheduler } from 'rxjs/internal/scheduler/AsyncScheduler';
import { SchedulerLike } from 'rxjs';
import { ContextProvider } from '../context/context.factory';

export const createEffectMetadata = <Scheduler extends SchedulerLike>(
  metadata: {
    ask: ContextProvider;
    scheduler?: Scheduler;
  },
): EffectMetadata => ({
  ask: metadata.ask,
  scheduler: metadata.scheduler || AsyncScheduler as any,
});
