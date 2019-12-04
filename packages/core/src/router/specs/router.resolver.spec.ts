import { mapTo, tap, map } from 'rxjs/operators';
import { HttpEffect, HttpMiddlewareEffect } from '../../effects/http-effects.interface';
import { EffectContext } from '../../effects/effects.interface';
import { findRoute, resolveRouting } from '../router.resolver';
import { HttpMethod, HttpServer } from '../../http.interface';
import { RouteMatched, Routing } from '../router.interface';
import { createHttpRequest, createMockEffectContext } from '../../+internal';

describe('#findRoute', () => {
  test('finds route inside collection', () => {
    // given
    const e1$: HttpEffect = req$ => req$.pipe(mapTo({ body: 'test' }));
    const e2$: HttpEffect = req$ => req$.pipe(mapTo({ body: 'test' }));
    const e3$: HttpEffect = req$ => req$.pipe(mapTo({ body: 'test' }));
    const e4$: HttpEffect = req$ => req$.pipe(mapTo({ body: 'test' }));

    const routing: Routing = [
      {
        regExp: /^\/?$/,
        path: '',
        methods: { GET: { effect: e1$ }, POST: { effect: e4$ } },
      },
      {
        regExp: /^\/group\/?$/,
        path: '/group',
        methods: { GET: { effect: e2$ } },
      },
      {
        regExp: /^\/group\/nested\/foo\/?$/,
        path: '/group/nested/foo',
        methods: { POST: { effect: e3$ } },
      },
    ];

    // when
    const validRoute1 = findRoute(routing, '/group/nested/foo', 'POST');
    const validRoute2 = findRoute(routing, '/group/nested/foo/', 'POST');
    const invalidRoute1 = findRoute(routing, '/group/nested/fo', 'POST');
    const invalidRoute2 = findRoute(routing, '/group/nested/foo', 'TEST' as HttpMethod);

    // then
    expect(validRoute1).toEqual({ effect: e3$, params: {}, path: '/group/nested/foo' });
    expect(validRoute2).toEqual({ effect: e3$, params: {}, path: '/group/nested/foo' });
    expect(invalidRoute1).toBeUndefined();
    expect(invalidRoute2).toBeUndefined();
  });

  test('finds parametrized route inside collection', () => {
    // given
    const e$: HttpEffect = req$ => req$.pipe(mapTo({ body: 'test' }));

    const routing: Routing = [{
      regExp: /^\/group\/([^\/]+)\/foo$/,
      path: '/group/:param/foo',
      methods: { GET: { effect: e$, parameters: ['param'] } }
    }];

    // when
    const route = findRoute(routing, '/group/nested/foo', 'GET');

    // then
    expect(route).toEqual({
      effect: e$,
      params: { param: 'nested' },
      path: '/group/:param/foo',
    });
  });

  test('matches wildcard route if doesn\'t found proper route', () => {
    // given
    const e1$: HttpEffect = req$ => req$.pipe(mapTo({ body: 'e1' }));
    const e2$: HttpEffect = req$ => req$.pipe(mapTo({ body: 'e2' }));

    const routing: Routing = [
      {
        regExp: /^\/group\/nested\/?$/,
        path: '/group/nested',
        methods: { GET: { effect: e1$ } },
      },
      {
        regExp: /^\/group.*?$/,
        path: '/group',
        methods: { '*': { effect: e2$ } },
      }
    ];

    // when
    const route1 = findRoute(routing, '/group/test', 'GET');
    const route2 = findRoute(routing, '/test', 'GET');

    // then
    expect(route1).toEqual({
      effect: e2$,
      middleware: undefined,
      params: {},
      path: '/group'
    });
    expect(route2).toBeUndefined();
  });
});

describe('#resolveRouting', () => {
  let router;
  let queryFactory;
  let ctx: EffectContext<HttpServer>;

  beforeEach(() => {
    jest.unmock('../router.resolver.ts');
    jest.unmock('../router.query.factory');
    router = require('../router.resolver.ts');
    queryFactory = require('../router.query.factory');
    ctx = createMockEffectContext();
  });

  test('resolves found effect', done => {
    // given
    const effect$: HttpEffect = req$ => req$.pipe(mapTo({ body: 'test' }));
    const expectedMachingResult: RouteMatched = { effect: effect$, params: {}, path: '/' };
    const req = createHttpRequest({ method: 'GET', url: '/' });

    // when
    router.findRoute = jest.fn(() => expectedMachingResult);
    queryFactory.queryParamsFactory = jest.fn(() => ({}));
    const resolvedRoute = resolveRouting([], ctx)(req);

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
    const req = createHttpRequest({ method: 'GET', url: '/' });

    // when
    router.findRoute = jest.fn(() => undefined);
    const resolvedRoute = resolveRouting([], ctx)(req);

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

  test('returns empty stream if response has been finished', done => {
    // given
    const req = createHttpRequest();
    req.response.finished = true;

    // when
    const resolvedRoute = resolveRouting([], ctx)(req);

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

  test('applies middlewares to found effect', done => {
    // given
    const middleware$: HttpMiddlewareEffect = req$ => req$.pipe(tap(req => req.test = 'test' ));
    const effect$: HttpEffect = req$ => req$.pipe(map(req => ({ body: req.test }) ));

    const expectedMachingResult: RouteMatched = { middleware: middleware$, effect: effect$, params: {}, path: '/' };
    const req = createHttpRequest({ method: 'GET', url: '/' });

    // when
    router.findRoute = jest.fn(() => expectedMachingResult);
    queryFactory.queryParamsFactory = jest.fn(() => ({}));
    const resolvedRoute = resolveRouting([], ctx)(req);

    // then
    resolvedRoute.subscribe(effect => {
      expect(effect.body).toEqual('test');
      done();
    });
  });
});
