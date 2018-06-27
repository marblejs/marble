import { mapTo } from 'rxjs/operators';
import { Effect } from '../effects/effects.interface';
import { routingFactory, findRoute, resolveRouting } from './router';
import { HttpRequest, HttpResponse } from '../http.interface';
import { RouteConfig, RouteGroup, Routing } from './router.interface';

describe('Router', () => {

  test('#routingFactory factorizes routing with nested groups', () => {
    // given
    const m$: Effect<HttpRequest> = req$ => req$;
    const e$: Effect = req$ => req$.pipe(mapTo({ body: 'test' }));

    const route: RouteConfig = {
      path: '/',
      method: 'GET',
      effect: e$,
    };

    const routeGroupNested: RouteGroup = {
      path: '/nested',
      effects: [route],
      middlewares: [m$],
    };

    const routeGroup: RouteGroup = {
      path: '/group',
      effects: [route, routeGroupNested],
      middlewares: [m$],
    };

    // when
    const factorizedRouting = routingFactory([
      route,
      routeGroup,
      route
    ]);

    // then
    expect(factorizedRouting).toEqual([
      ['/', 'GET', e$],
      ['/group', [
        ['/', 'GET', e$],
        ['/nested', [
          ['/', 'GET', e$],
        ]],
      ]],
      ['/', 'GET', e$],
    ]);
  });

  test('#findRoute finds route inside collection', () => {
    // given
    const e$: Effect = req$ => req$.pipe(mapTo({ body: 'test' }));
    const routing: Routing = [
      ['/', 'GET', e$],
      ['/group', [
        ['/bar', 'GET', e$],
        ['/nested', [
          ['/foo', 'POST', e$],
        ]],
      ]],
      ['/foo', 'GET', e$]
    ];

    // when
    const route1 = findRoute(routing, '/group/nested/foo?bar=baz', 'POST', '');
    const route2 = findRoute(routing, '/group/nested/foo?', 'POST', '');
    const route3 = findRoute(routing, '/group/nested/foo', 'POST', '');
    const route4 = findRoute(routing, '/group/nested/fo', 'POST', '');

    // then
    expect(route1).toEqual(['/foo', 'POST', e$ ]);
    expect(route2).toEqual(['/foo', 'POST', e$ ]);
    expect(route3).toEqual(['/foo', 'POST', e$ ]);
    expect(route4).toBeUndefined();
  });

  describe('#resolveRouting', () => {
    let router;
    let queryFactory;
    let paramsFactory;

    beforeEach(() => {
      jest.unmock('./router.ts');
      jest.unmock('../router/queryParams.factory');
      jest.unmock('../router/urlParams.factory');
      router = require('./router.ts');
      queryFactory = require('../router/queryParams.factory');
      paramsFactory = require('../router/urlParams.factory');
    });

    test('resolves found effect', done => {
      // given
      const effect$: Effect = req$ => req$.pipe(mapTo({ body: 'test' }));
      const expectedMachingResult = ['/', 'GET', effect$];
      const req = { url: '/', method: 'GET', query: null, params: null } as HttpRequest;
      const res = {} as HttpResponse;
      const mockedQuery = {};
      const mockedParams = {};

      // when
      router.findRoute = jest.fn(() => expectedMachingResult);
      queryFactory.queryParamsFactory = jest.fn(() => mockedQuery);
      paramsFactory.urlParamsFactory = jest.fn(() => mockedParams);
      const resolvedRoute = resolveRouting([])(res)(req);

      // then
      resolvedRoute.subscribe(effect => {
        expect(effect).toBeDefined();
        expect(effect.body).toEqual('test');
        expect(req.query).toEqual(mockedQuery);
        done();
      });
    });

    test('returns empty stream if effect has been not found', done => {
      // given
      const req = { url: '/', method: 'GET', query: null, params: null } as HttpRequest;
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
