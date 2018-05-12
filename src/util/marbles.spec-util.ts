import { Observable, from } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { Effect, EffectResponse } from '../effects/effects.interface';
import { HttpRequest, HttpResponse } from '../http.interface';

type _ = EffectResponse;
type MarbleFlow = [string, object];
type MarbleDependencies = { response: HttpResponse, error?: Error };

export namespace Marbles {

  const deepEquals = (actual, expected) =>
    expect(actual).toEqual(expected);

  const createTestScheduler = () =>
    new TestScheduler(deepEquals);

  export const assertEffect = (
    effect: Effect,
    marbleflow: [MarbleFlow, MarbleFlow],
    depts: MarbleDependencies = { response: {} as HttpResponse },
  ) => {
    const [initStream, initValues] = marbleflow[0];
    const [expectedStream, expectedValues] = marbleflow[1];

    const scheduler = createTestScheduler();
    const observable = scheduler.createColdObservable(initStream, initValues);
    const effectStream = from(observable) as Observable<HttpRequest>;

    scheduler
      .expectObservable(effect(effectStream, depts.response, depts.error))
      .toBe(expectedStream, expectedValues);

    scheduler.flush();
  };

  export const assertCombinedEffects = <T>(
    effects$: Observable<T>,
    marbleflow: MarbleFlow,
  ) => {
    const [expectedStream, expectedValues] = marbleflow;
    const scheduler = createTestScheduler();

    scheduler
      .expectObservable(effects$)
      .toBe(expectedStream, expectedValues);

    scheduler.flush();
  };

}
