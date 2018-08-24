import { mapTo } from 'rxjs/operators';
import { EffectFactory } from '../../effects/effects.factory';
import { Effect, Middleware } from '../../effects/effects.interface';
import { RouteEffect, RouteEffectGroup, Routing } from '../router.interface';
import { factorizeRouting, combineRoutes } from '../router.factory';

describe('Router factory', () => {
  let effectsCombiner;

  beforeEach(() => {
    jest.unmock('../../effects/effects.combiner.ts');
    effectsCombiner = require('../../effects/effects.combiner');
  });

  test('#factorizeRouting factorizes routing with nested groups', () => {
    // given
    const m$:  Middleware = req$ => req$;
    const e1$: Effect = req$ => req$.pipe(mapTo({ body: 'test1' }));
    const e2$: Effect = req$ => req$.pipe(mapTo({ body: 'test2' }));
    const e3$: Effect = req$ => req$.pipe(mapTo({ body: 'test3' }));
    const e4$: Effect = req$ => req$.pipe(mapTo({ body: 'test4' }));

    const route1: RouteEffect = { path: '/', method: 'GET', effect: e1$ };
    const route2: RouteEffect = { path: '/', method: 'GET', effect: e2$ };
    const route3: RouteEffect = { path: '/', method: 'GET', effect: e3$ };
    const route4: RouteEffect = { path: '/', method: 'POST', effect: e4$ };

    const routeGroupNested: RouteEffectGroup = {
      path: '/nested',
      effects: [route3],
      middlewares: [m$],
    };

    const routeGroup: RouteEffectGroup = {
      path: '/group',
      effects: [route2, routeGroupNested],
      middlewares: [m$],
    };

    // when
    effectsCombiner.combineMiddlewareEffects = jest.fn(() => m$);

    const factorizedRouting = factorizeRouting([
      route1,
      routeGroup,
      route4
    ]);

    // then
    expect(factorizedRouting).toEqual([
      {
        regExp: /^\/?$/,
        methods: { GET: { effect: e1$ }, POST: { effect: e4$ } },
      },
      {
        regExp: /^\/group\/?$/,
        methods: { GET: { middleware: m$, effect: e2$ } },
      },
      {
        regExp: /^\/group\/nested\/?$/,
        methods: { GET: { middleware: m$, effect: e3$ } },
      },
    ] as Routing);
  });

  test('#factorizeRouting throws error if route is redefined', () => {
    // given
    const e1$: Effect = req$ => req$.pipe(mapTo({ body: 'test1' }));
    const e2$: Effect = req$ => req$.pipe(mapTo({ body: 'test2' }));
    const e3$: Effect = req$ => req$.pipe(mapTo({ body: 'test3' }));

    const route1: RouteEffect = { path: '/test', method: 'GET', effect: e1$ };
    const route2: RouteEffect = { path: '/test', method: 'GET', effect: e2$ };
    const route3: RouteEffect = { path: '/test/foo', method: 'GET', effect: e3$ };

    // when
    const error = () => factorizeRouting([
      route1,
      route2,
      route3,
    ]);

    // then
    expect(error).toThrowError('Redefinition of route at "GET: /test"');
  });

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
      const effect$ = req$ => req$.pipe(mapTo({}));
      const a$ = EffectFactory.matchPath('/a').matchType('GET').use(effect$);
      const b$ = EffectFactory.matchPath('/b').matchType('GET').use(effect$);

      const m1$: Middleware = req$ => req$;
      const m2$: Middleware = req$ => req$;

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

});
