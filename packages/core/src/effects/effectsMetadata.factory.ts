import { EffectMetadata } from './effects.interface';
import { AsyncScheduler } from 'rxjs/internal/scheduler/AsyncScheduler';
import { SchedulerLike } from 'rxjs';
import { InjectorGetter } from '../server/server.injector';

export const createEffectMetadata = <T extends SchedulerLike, U extends Error>(
  metadata: { inject: InjectorGetter, scheduler?: T, error?: U; }
): EffectMetadata<U> => ({
  inject: metadata.inject,
  scheduler: metadata.scheduler || AsyncScheduler as any,
  error: metadata.error,
});
