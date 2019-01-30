import { mapTo } from 'rxjs/operators';
import { HttpEffect, HttpMiddlewareEffect } from '../../effects/http-effects.interface';
import { RouteEffect, RouteEffectGroup, Routing } from '../router.interface';
import { factorizeRouting } from '../router.factory';

describe('#factorizeRouting', () => {
  let effectsCombiner;

  beforeEach(() => {
    jest.unmock('../../effects/effects.combiner.ts');
    effectsCombiner = require('../../effects/effects.combiner');
  });

  test('factorizes routing with nested groups', () => {
    // given
    const m$: HttpMiddlewareEffect = req$ => req$;
    const e1$: HttpEffect = req$ => req$.pipe(mapTo({ body: 'test1' }));
    const e2$: HttpEffect = req$ => req$.pipe(mapTo({ body: 'test2' }));
    const e3$: HttpEffect = req$ => req$.pipe(mapTo({ body: 'test3' }));
    const e4$: HttpEffect = req$ => req$.pipe(mapTo({ body: 'test4' }));
    const e5$: HttpEffect = req$ => req$.pipe(mapTo({ body: 'test5' }));

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

  test('throws error if route is redefined', () => {
    // given
    const e$: HttpEffect = req$ => req$.pipe(mapTo({ body: 'test' }));

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
});
