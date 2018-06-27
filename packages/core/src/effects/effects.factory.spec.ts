import { mapTo } from 'rxjs/operators';
import { Effect } from './effects.interface';
import { EffectFactory } from './effects.factory';

describe('Effects factory', () => {

  test('#effect factorizes RouteConfig', () => {
    // given
    const effect$: Effect = req$ => req$.pipe(mapTo({ body: 'test' }));
    const path = '/foo';
    const method = 'GET';

    // when
    const factorizedEffect = EffectFactory
      .matchPath(path)
      .matchType(method)
      .use(effect$);

    // then
    expect(factorizedEffect).toEqual({
      path: '/foo',
      method: 'GET',
      effect: effect$,
    });
  });

});
