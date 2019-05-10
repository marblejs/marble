import { TestScheduler } from 'rxjs/testing';
import { EffectMetadata, EffectLike } from '../../effects/effects.interface';

type MarbleFlow = [string, { [marble: string]: any } | undefined];
type MarbleDependencies = { client?: any; meta?: Partial<EffectMetadata> };

export const Marbles = {
  deepEquals: (actual: any, expected: any) => expect(actual).toEqual(expected),

  createTestScheduler: () => new TestScheduler(Marbles.deepEquals),

  assertEffect: (
    effect: EffectLike,
    marbleflow: [MarbleFlow, MarbleFlow],
    dependencies: MarbleDependencies = {},
  ) => {
    const [initStream, initValues] = marbleflow[0];
    const [expectedStream, expectedValues] = marbleflow[1];

    const scheduler = Marbles.createTestScheduler();
    const stream$ = scheduler.createColdObservable(initStream, initValues);

    scheduler
      .expectObservable(effect(stream$, dependencies.client, dependencies.meta))
      .toBe(expectedStream, expectedValues);

    scheduler.flush();
  },
}
