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
    const m$: Middleware = req$ => req$;
    const e1$: Effect = req$ => req$.pipe(mapTo({ body: 'test1' }));
    const e2$: Effect = req$ => req$.pipe(mapTo({ body: 'test2' }));
    const e3$: Effect = req$ => req$.pipe(mapTo({ body: 'test3' }));
    const e4$: Effect = req$ => req$.pipe(mapTo({ body: 'test4' }));
    const e5$: Effect = req$ => req$.pipe(mapTo({ body: 'test5' }));

    const routeGroupNested: RouteEffectGroup = {
      path: '/nested',
      effects: [{ path: '/', method: 'GET', effect: e5$ }],
      middlewares: [m$],
    };

    const routeGroup: RouteEffectGroup = {
      path: '/:id',
      effects: [
        { path: '/', method: 'GET', effect: e2$ },
        { path: '/', method: 'POST', effect: e3$ },
        routeGroupNested,
        { path: '*', method: '*', effect: e4$ },
      ],
      middlewares: [m$],
    };

    const routing: (RouteEffect | RouteEffectGroup)[] = [
      { path: '/', method: 'GET', effect: e1$ },
      routeGroup,
    ];

    // when
    effectsCombiner.combineMiddlewares = jest.fn(() => m$);
    const factorizedRouting = factorizeRouting(routing);

    // then
    expect(factorizedRouting).toEqual([
      {
        regExp: /^(?:\/)?$/i,
        path: '',
        methods: { GET: { effect: e1$, middleware: undefined, parameters: undefined } },
      },
      {
        regExp: /^\/([^\/]+?)(?:\/)?$/i,
        path: '/:id',
        methods: {
          GET: { middleware: m$, effect: e2$, parameters: ['id'] },
          POST: { middleware: m$, effect: e3$, parameters: ['id'] },
        },
      },
      {
        regExp: /^\/([^\/]+?)\/nested(?:\/)?$/i,
        path: '/:id/nested',
        methods: { GET: { middleware: m$, effect: e5$, parameters: ['id'] } },
      },
      {
        regExp: /^\/([^\/]+?)\/(.*)(?:\/)?$/i,
        path: '/:id/(.*)',
        methods: { '*': { middleware: m$, effect: e4$, parameters: ['id'] } },
      },
    ] as Routing);
  });

  test('#factorizeRouting throws error if route is redefined', () => {
    // given
    const e$: Effect = req$ => req$.pipe(mapTo({ body: 'test' }));

    const route1: RouteEffect = { path: '/test', method: 'GET', effect: e$ };
    const route2: RouteEffect = { path: '/test', method: 'GET', effect: e$ };
    const route3: RouteEffect = { path: '/test/foo', method: 'GET', effect: e$ };

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
