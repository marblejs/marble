import { Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

type MarbleFlow = [string, { [marble: string]: any; } | undefined];
type MarbleDependencies = { client?: any; meta?: any };

export namespace Marbles {
  const deepEquals = (actual: any, expected: any) => expect(actual).toEqual(expected);

  export const createTestScheduler = () => new TestScheduler(deepEquals);

  export const assertEffect = (
    effect: (...args: any[]) => Observable<any>,
    marbleflow: [MarbleFlow, MarbleFlow],
    depts: MarbleDependencies = {},
  ) => {
    const [initStream, initValues] = marbleflow[0];
    const [expectedStream, expectedValues] = marbleflow[1];

    const scheduler = createTestScheduler();
    const stream$ = scheduler.createColdObservable(initStream, initValues);

    scheduler
      .expectObservable(effect(stream$, depts.client, depts.meta))
      .toBe(expectedStream, expectedValues);

    scheduler.flush();
  };
}
