/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { of } from 'rxjs';
import { mapTo, tap } from 'rxjs/operators';
import { RouteEffect, RouteEffectGroup, Routing } from '../router.interface';
import { factorizeRouting } from '../router.factory';
import { createHttpRequest, createMockEffectContext } from '../../+internal';
import { HttpEffect, HttpMiddlewareEffect } from '../../effects/http-effects.interface';
import { factorizeRegExpWithParams } from '../router.params.factory';

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
          GET: { effect: e1$, middleware: undefined, parameters: undefined, },
        },
      },
      {
        regExp: getRegExp('/level_1'),
        path: '/level_1',
        methods: {
          GET: { middleware: expect.any(Function), effect: e2$, parameters: undefined, },
        },
      },
      {
        regExp: getRegExp('/level_1/:id1'),
        path: '/level_1/:id1',
        methods: {
          POST: { middleware: expect.any(Function), effect: e3$, parameters: ['id1'] },
          DELETE: { middleware: expect.any(Function), effect: e3$, parameters: ['id2'] },
        },
      },
      {
        regExp: getRegExp('/level_1/level_2'),
        path: '/level_1/level_2',
        methods: {
          GET: { middleware: expect.any(Function), effect: e4$, parameters: undefined, },
        },
      },
      {
        regExp: getRegExp('/level_1/*'),
        path: '/level_1/(.*)',
        methods: {
          '*': { middleware: expect.any(Function), effect: e5$ },
        },
      },
    ] as Routing);
  });

  test('composes routed middlewares', async () => {
    // given
    const spy = jest.fn();
    const req = createHttpRequest();
    const ctx = createMockEffectContext();
    const m$: HttpMiddlewareEffect = req$ => req$.pipe(tap(spy));
    const e$: HttpEffect = req$ => req$.pipe(mapTo({ body: 'test' }));

    const routeEffect: RouteEffect = {
      path: '/',
      method: 'GET',
      effect: e$,
      middleware: m$,
    };

    const routeGroupNested: RouteEffectGroup = {
      path: '/nested',
      effects: [routeEffect],
      middlewares: [m$],
    };

    const routing: (RouteEffect | RouteEffectGroup)[] = [{
      path: '/test',
      effects: [routeGroupNested],
      middlewares: [m$, m$],
    }];

    // when
    const factorizedRouting = factorizeRouting(routing);
    const middleware$ = factorizedRouting[0].methods.GET!.middleware!;
    await middleware$(of(req), ctx).toPromise();

    // then
    expect(spy).toHaveBeenCalledTimes(4);
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
