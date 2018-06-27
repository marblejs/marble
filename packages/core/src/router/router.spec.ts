import { mapTo } from 'rxjs/operators';
import { Effect } from '../effects/effects.interface';
import { findRoute, resolveRouting, routingFactory } from './router';
import { HttpRequest, HttpResponse } from '../http.interface';
import { RouteConfig, RouteGroup, RouteMatched, Routing } from './router.interface';

describe('Router', () => {

  test('#routingFactory factorizes routing with nested groups', () => {
    // given
    const m$: Effect<HttpRequest> = req$ => req$;
    const e1$: Effect = req$ => req$.pipe(mapTo({ body: 'test1' }));
    const e2$: Effect = req$ => req$.pipe(mapTo({ body: 'test2' }));
    const e3$: Effect = req$ => req$.pipe(mapTo({ body: 'test3' }));
    const e4$: Effect = req$ => req$.pipe(mapTo({ body: 'test4' }));

    const route1: RouteConfig = { path: '/', method: 'GET', effect: e1$ };
    const route2: RouteConfig = { path: '/', method: 'GET', effect: e2$ };
    const route3: RouteConfig = { path: '/', method: 'GET', effect: e3$ };
    const route4: RouteConfig = { path: '/', method: 'POST', effect: e4$ };

    const routeGroupNested: RouteGroup = {
      path: '/nested',
      effects: [route3],
      middlewares: [m$],
    };

    const routeGroup: RouteGroup = {
      path: '/group',
      effects: [route2, routeGroupNested],
      middlewares: [m$],
    };

    // when
    const factorizedRouting = routingFactory([
      route1,
      routeGroup,
      route4
    ]);

    // then
    expect(factorizedRouting).toEqual([
      { regExp: /^\/?$/, methods: { GET: { effect: e1$ }, POST: { effect: e4$ } } },
      { regExp: /^\/group\/?$/, methods: { GET: { middleware: m$, effect: e2$ } } },
      {
        regExp: /^\/group\/nested\/?$/,
        methods: {
          GET: { middleware: factorizedRouting[2].methods.GET!.middleware, effect: e3$ }
        },
      },
    ] as Routing);
  });

  test('#findRoute finds route inside collection', () => {
    // given
    const e1$: Effect = req$ => req$.pipe(mapTo({ body: 'test' }));
    const e2$: Effect = req$ => req$.pipe(mapTo({ body: 'test' }));
    const e3$: Effect = req$ => req$.pipe(mapTo({ body: 'test' }));
    const e4$: Effect = req$ => req$.pipe(mapTo({ body: 'test' }));
    const routing: Routing = [
      { regExp: /^\/?$/, methods: { GET: { effect: e1$ }, POST: { effect: e4$ } } },
      { regExp: /^\/group\/?$/, methods: { GET: { effect: e2$ } } },
      { regExp: /^\/group\/nested\/foo\/?$/, methods: { POST: { effect: e3$ } } },
    ];

    // when
    const route1 = findRoute(routing, '/group/nested/foo', 'POST');
    const route2 = findRoute(routing, '/group/nested/fo', 'POST');

    // then
    expect(route1).toEqual({ effect: e3$, middleware: undefined, params: {} });
    expect(route2).toBeUndefined();
  });

  describe('#resolveRouting', () => {
    let router;
    let queryFactory;

    beforeEach(() => {
      jest.unmock('./router.ts');
      jest.unmock('../router/queryParams.factory');
      router = require('./router.ts');
      queryFactory = require('../router/queryParams.factory');
    });

    test('resolves found effect', done => {
      // given
      const effect$: Effect = req$ => req$.pipe(mapTo({ body: 'test' }));
      const expectedMachingResult: RouteMatched = { effect: effect$, params: {} };
      const req = { url: '/', method: 'GET', query: {}, params: {} } as HttpRequest;
      const res = {} as HttpResponse;

      // when
      router.findRoute = jest.fn(() => expectedMachingResult);
      queryFactory.queryParamsFactory = jest.fn(() => ({}));
      const resolvedRoute = resolveRouting([])(res)(req);

      // then
      resolvedRoute.subscribe(effect => {
        expect(effect).toBeDefined();
        expect(effect.body).toEqual('test');
        expect(req.query).toEqual({});
        done();
      });
    });

    test('returns empty stream if effect has been not found', done => {
      // given
      const req = { url: '/', method: 'GET', query: {}, params: {} } as HttpRequest;
      const res = {} as HttpResponse;

      // when
      router.findRoute = jest.fn(() => undefined);
      const resolvedRoute = resolveRouting([])(res)(req);

      // then
      resolvedRoute.subscribe(
        () => {
          fail('Stream should be empty');
          done();
        },
        () => {
          fail('Stream should be empty');
          done();
        },
        () => {
          expect(true).toEqual(true);
          done();
        }
      );
    });
  });

});
