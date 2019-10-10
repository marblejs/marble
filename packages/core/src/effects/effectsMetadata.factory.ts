import { EffectMetadata } from './effects.interface';
import { AsyncScheduler } from 'rxjs/internal/scheduler/AsyncScheduler';
import { SchedulerLike } from 'rxjs';
import { ContextProvider } from '../context/context.factory';

export const createEffectMetadata = <Client, Scheduler extends SchedulerLike>(
  metadata: {
    ask: ContextProvider;
    client: Client;
    scheduler?: Scheduler;
  },
): EffectMetadata<Client> => ({
  ask: metadata.ask,
  client: metadata.client,
  scheduler: metadata.scheduler || AsyncScheduler as any,
});
