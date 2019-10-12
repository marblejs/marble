import { EffectContext } from './effects.interface';
import { AsyncScheduler } from 'rxjs/internal/scheduler/AsyncScheduler';
import { SchedulerLike } from 'rxjs';
import { ContextProvider } from '../context/context.factory';

export const createEffectContext = <Client, Scheduler extends SchedulerLike>(
  data: {
    ask: ContextProvider;
    client: Client;
    scheduler?: Scheduler;
  },
): EffectContext<Client> => ({
  ask: data.ask,
  client: data.client,
  scheduler: data.scheduler || AsyncScheduler as any,
});
