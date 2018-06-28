import { mapTo } from 'rxjs/operators';
import { Effect } from '../effects/effects.interface';
import { findRoute, resolveRouting } from './router';
import { HttpRequest, HttpResponse, HttpMethod } from '../http.interface';
import { RouteMatched, Routing } from './router.interface';

describe('Router', () => {

  describe('#findRoute', () => {
    test('finds route inside collection', () => {
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
      const route3 = findRoute(routing, '/group/nested/foo', 'TEST' as HttpMethod);

      // then
      expect(route1).toEqual({ effect: e3$, params: {} });
      expect(route2).toBeUndefined();
      expect(route3).toBeUndefined();
    });

    test('finds parametrized route inside collection', () => {
      // given
      const e$: Effect = req$ => req$.pipe(mapTo({ body: 'test' }));

      const routing: Routing = [{
        regExp: /^\/group\/([^\/]+)\/foo$/,
        methods: { GET: { effect: e$, parameters: ['param'] } }
      }];

      // when
      const route = findRoute(routing, '/group/nested/foo', 'GET');

      // then
      expect(route).toEqual({
        effect: e$,
        params: { param: 'nested' }
      });
    });
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
