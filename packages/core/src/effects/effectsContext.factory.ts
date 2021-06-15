import { SchedulerLike, asyncScheduler } from 'rxjs';
import { ContextProvider } from '../context/context';
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
  scheduler: data.scheduler || typeof asyncScheduler as any,
});
