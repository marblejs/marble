import { mapTo } from 'rxjs/operators';
import { Effect } from './effects.interface';
import { effect } from './effects.factory';

describe('Effects factory', () => {

  test('#effect factorizes RouteConfig', () => {
    // given
    const effect$: Effect = req$ => req$.pipe(mapTo({ body: 'test' }));
    const path = '/foo';
    const method = 'GET';

    // when
    const factorizedEffect = effect(path)(method)(effect$);

    // then
    expect(factorizedEffect).toEqual({
      path: '/foo',
      method: 'GET',
      effect: effect$,
    });
  });

});
