/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { of } from 'rxjs';
import { mapTo, tap } from 'rxjs/operators';
import { RouteEffect, RouteEffectGroup, Routing } from '../router.interface';
import { factorizeRouting } from '../router.factory';
import { createHttpRequest, createMockEffectContext } from '../../+internal';
import { HttpEffect, HttpMiddlewareEffect } from '../../effects/http-effects.interface';

describe('#factorizeRouting', () => {
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
      effects: [{ path: '/', method: 'GET', effect: e5$, middleware: m$ }],
      middlewares: [m$],
    };

    const routeGroup: RouteEffectGroup = {
      path: '/:id',
      effects: [
        { path: '/', method: 'GET', effect: e2$ },
        { path: '/', method: 'POST', effect: e3$, middleware: m$ },
        routeGroupNested,
        { path: '*', method: '*', effect: e4$ },
      ],
      middlewares: [m$, m$],
    };

    const routing: (RouteEffect | RouteEffectGroup)[] = [
      { path: '/', method: 'GET', effect: e1$ },
      routeGroup,
    ];

    // when
    const factorizedRouting = factorizeRouting(routing);

    // then
    expect(factorizedRouting).toEqual([
      {
        regExp: /^(?:\/)?$/i,
        path: '',
        methods: {
          GET: { effect: e1$, middleware: undefined, parameters: undefined },
        },
      },
      {
        regExp: /^\/([^\/]+?)(?:\/)?$/i,
        path: '/:id',
        parameters: ['id'],
        methods: {
          GET: { middleware: expect.any(Function), effect: e2$ },
          POST: { middleware: expect.any(Function), effect: e3$ },
        },
      },
      {
        regExp: /^\/([^\/]+?)\/nested(?:\/)?$/i,
        path: '/:id/nested',
        parameters: ['id'],
        methods: {
          GET: { middleware: expect.any(Function), effect: e5$ },
        },
      },
      {
        regExp: /^\/([^\/]+?)\/(.*)(?:\/)?$/i,
        path: '/:id/(.*)',
        parameters: ['id'],
        methods: {
          '*': { middleware: expect.any(Function), effect: e4$ },
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
