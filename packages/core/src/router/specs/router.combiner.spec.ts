import { mapTo } from 'rxjs/operators';
import { combineRoutes } from '../router.combiner';
import { EffectFactory } from '../../effects/effects.factory';
import { HttpMiddleware, HttpEffect } from '../../effects/http-effects.interface';

describe('#combineRoutes', () => {
  test('factorizes combined routes for effects only', () => {
    // given
    const effect$ = req$ => req$.pipe(mapTo({}));
    const a$ = EffectFactory.matchPath('/a').matchType('GET').use(effect$);
    const b$ = EffectFactory.matchPath('/b').matchType('GET').use(effect$);

    // when
    const combiner = combineRoutes('/test', [a$, b$]);

    // then
    expect(combiner).toEqual({
      path: '/test',
      middlewares: [],
      effects: [a$, b$],
    });
  });

  test('factorizes combined routes for effects with middlewares', () => {
    // given
    const effect$: HttpEffect = req$ => req$.pipe(mapTo({}));
    const a$ = EffectFactory.matchPath('/a').matchType('GET').use(effect$);
    const b$ = EffectFactory.matchPath('/b').matchType('GET').use(effect$);

    const m1$: HttpMiddleware = req$ => req$;
    const m2$: HttpMiddleware = req$ => req$;

    // when
    const combiner = combineRoutes('/test', {
      middlewares: [m1$, m2$],
      effects: [a$, b$],
    });

    // then
    expect(combiner).toEqual({
      path: '/test',
      middlewares: [m1$, m2$],
      effects: [a$, b$],
    });
  });

  test('factorizes combined routes for effects with empty middlewares', () => {
    // given
    const effect$ = req$ => req$.pipe(mapTo({}));
    const a$ = EffectFactory.matchPath('/a').matchType('GET').use(effect$);
    const b$ = EffectFactory.matchPath('/b').matchType('GET').use(effect$);

    // when
    const combiner = combineRoutes('/test', {
      effects: [a$, b$],
    });

    // then
    expect(combiner).toEqual({
      path: '/test',
      middlewares: [],
      effects: [a$, b$],
    });
  });
});
