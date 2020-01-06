import { SchedulerLike } from 'rxjs';
import { AsyncScheduler } from 'rxjs/internal/scheduler/AsyncScheduler';
import { ContextProvider } from '../context/context.factory';
import { EffectContext } from './effects.interface';

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
