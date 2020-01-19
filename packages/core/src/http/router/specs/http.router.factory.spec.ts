/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { mapTo } from 'rxjs/operators';
import { RouteEffect, RouteEffectGroup, Routing } from '../http.router.interface';
import { factorizeRouting, factorizeRoutingWithDefaults } from '../http.router.factory';
import { HttpEffect, HttpMiddlewareEffect } from '../../effects/http.effects.interface';
import { factorizeRegExpWithParams } from '../http.router.params.factory';
import { r } from '../http.router.ixbuilder';

const getRegExp = (path: string) => factorizeRegExpWithParams(path).regExp;

describe('#factorizeRouting', () => {
  test('factorizes routing with nested groups', () => {
    // given
    const m$: HttpMiddlewareEffect = req$ => req$;
    const e1$: HttpEffect = req$ => req$.pipe(mapTo({ body: 'test1' }));
    const e2$: HttpEffect = req$ => req$.pipe(mapTo({ body: 'test2' }));
    const e3$: HttpEffect = req$ => req$.pipe(mapTo({ body: 'test3' }));
    const e4$: HttpEffect = req$ => req$.pipe(mapTo({ body: 'test4' }));
    const e5$: HttpEffect = req$ => req$.pipe(mapTo({ body: 'test5' }));

    const routing: (RouteEffect | RouteEffectGroup)[] = [
      // effect 1
      {
        path: '/',
        method: 'GET',
        effect: e1$,
      },
      // combined
      {
        path: '/level_1',
        middlewares: [m$, m$],
        effects: [
          // effect 2
          {
            path: '/',
            method: 'GET',
            effect: e2$,
          },
          // effect 3
          {
            path: '/:id1',
            method: 'POST',
            effect: e3$,
            middleware: m$,
          },
          // effect 3
          {
            path: '/:id2',
            method: 'DELETE',
            effect: e3$,
            middleware: m$,
          },
          // combined
          {
            path: '/level_2',
            middlewares: [m$],
            effects: [
              // effect 4
              {
                path: '/',
                method: 'GET',
                effect: e4$,
                middleware: m$
              },
            ],
          },
          // effect 5
          {
            path: '*',
            method: '*',
            effect: e5$,
          },
        ],
      },
    ];

    // when
    const factorizedRouting = factorizeRouting(routing);

    // then
    expect(factorizedRouting).toEqual([
      {
        regExp: getRegExp('/'),
        path: '',
        methods: {
          GET: { middlewares: [], effect: e1$, parameters: undefined, meta: undefined },
        },
      },
      {
        regExp: getRegExp('/level_1'),
        path: '/level_1',
        methods: {
          GET: { middlewares: [m$, m$], effect: e2$, parameters: undefined, meta: undefined },
        },
      },
      {
        regExp: getRegExp('/level_1/:id1'),
        path: '/level_1/:id1',
        methods: {
          POST: { middlewares: [m$, m$, m$], effect: e3$, parameters: ['id1'], meta: undefined},
          DELETE: { middlewares: [m$, m$, m$], effect: e3$, parameters: ['id2'], meta: undefined },
        },
      },
      {
        regExp: getRegExp('/level_1/level_2'),
        path: '/level_1/level_2',
        methods: {
          GET: { middlewares: [m$, m$, m$, m$], effect: e4$, parameters: undefined, meta: undefined },
        },
      },
      {
        regExp: getRegExp('/level_1/*'),
        path: '/level_1/(.*)',
        methods: {
          '*': { middlewares: [m$, m$], effect: e5$, meta: undefined },
        },
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

describe('#factorizeRoutingWithDefaults', () => {
  test('adds fallback route', () => {
    const factorizedRouting = factorizeRoutingWithDefaults([]);

    expect(factorizedRouting).toEqual([
      {
        regExp: getRegExp('/*'),
        path: '/(.*)',
        methods: {
          '*': {
            effect: expect.any(Function),
            middlewares: [],
            parameters: undefined,
            meta: { overridable: true },
          },
        },
      },
    ] as Routing);
  });

  test('allows to redefine fallback route', () => {
    const fallback$ = r.pipe(
      r.matchPath('*'),
      r.matchType('*'),
      r.useEffect(req$ => req$.pipe(mapTo({ body: 'fallback' }))));

    const factorizedRouting = factorizeRoutingWithDefaults([ fallback$ ]);

    expect(factorizedRouting).toEqual([
      {
        regExp: getRegExp('/*'),
        path: '/(.*)',
        methods: {
          [fallback$.method]: {
            effect: fallback$.effect,
            middlewares: [],
            parameters: undefined,
          },
        },
      },
    ] as Routing);
  });
});
