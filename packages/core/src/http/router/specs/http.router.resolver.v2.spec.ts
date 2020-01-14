/* eslint-disable @typescript-eslint/camelcase */

import { of } from 'rxjs';
import { mapTo, take, toArray, delay, mergeMap, map } from 'rxjs/operators';
import { createMockEffectContext, createHttpRequest, createHttpResponse } from '../../../+internal';
import { HttpEffect } from '../../effects/http.effects.interface';
import { Routing, RoutingItem } from '../http.router.interface';
import { resolveRouting } from '../http.router.resolver.v2';
import { factorizeRegExpWithParams } from '../http.router.params.factory';

describe('#resolveRouting', () => {
  test('resolves routes inside collection', async (done) => {
    // given
    const ctx = createMockEffectContext();
    const response = createHttpResponse();
    response.send = jest.fn();

    const path1 = factorizeRegExpWithParams('/');
    const path2 = factorizeRegExpWithParams('/group');
    const path3 = factorizeRegExpWithParams('/group/:id/foo');

    const e1$: HttpEffect = req$ => req$.pipe(mapTo({ body: 'test_1' }));
    const e2$: HttpEffect = req$ => req$.pipe(mapTo({ body: 'test_2' }));
    const e3$: HttpEffect = req$ => req$.pipe(mapTo({ body: 'test_3' }));
    const e4$: HttpEffect = req$ => req$.pipe(mapTo({ body: 'test_4' }));

    const req1 = createHttpRequest(({ url: '/', method: 'GET', response }));
    const req2 = createHttpRequest(({ url: '/', method: 'POST', response }));
    const req3 = createHttpRequest(({ url: '/group', method: 'GET', response }));
    const req4 = createHttpRequest(({ url: '/group/123/foo', method: 'POST', response }));
    const req5 = createHttpRequest(({ url: '/unknown', method: 'GET', response }));

    const routing: Routing = [
      {
        regExp: path1.regExp,
        path: path1.path,
        methods: { GET: { effect: e1$, middlewares: [] }, POST: { effect: e2$, middlewares: [] } },
      },
      {
        regExp: path2.regExp,
        path: path2.path,
        methods: { GET: { effect: e3$, middlewares: [], parameters: ['id'] } },
      },
      {
        regExp: path3.regExp,
        path: path3.path,
        methods: { POST: { effect: e4$, middlewares: [] } },
      },
    ];

    // when
    const { resolve, outputSubject } = resolveRouting(routing, ctx)();

    // then
    outputSubject.pipe(take(4), toArray()).subscribe(
      result => {
        expect(result[0].res).toEqual({ body: 'test_1', request: req1 });
        expect(result[1].res).toEqual({ body: 'test_2', request: req2 });
        expect(result[2].res).toEqual({ body: 'test_3', request: req3 });
        expect(result[3].res).toEqual({ body: 'test_4', request: req4 });
        done();
      },
    );

    resolve(req1);
    resolve(req2);
    resolve(req3);
    resolve(req4);
    resolve(req5);
  });

  test('returns undefined if route cannot be resolved', () => {
    // given
    const ctx = createMockEffectContext();
    const response = createHttpResponse();
    const req = createHttpRequest(({ url: '/unknown', method: 'GET', response }));
    const path = factorizeRegExpWithParams('/');

    const effect$: HttpEffect = req$ => req$.pipe(mapTo({ body: 'test' }));

    const routing: Routing = [{
      regExp: path.regExp,
      path: path.path,
      methods: { GET: { effect: effect$, middlewares: [] } },
    }];

    // when
    const subject = resolveRouting(routing, ctx)().resolve(req);

    // then
    expect(subject).toBeUndefined();
  });

  test('handles concurrent requests for the same path', done => {
    // given
    const delays = [10, 20, 30, 40];
    const ctx = createMockEffectContext();
    const path = factorizeRegExpWithParams('/delay/:delay');
    const testData = delays.map(delay => createHttpRequest(({ url: `/delay/${delay}`, method: 'GET' })));

    const effect: HttpEffect = req$ =>
      req$.pipe(
        map(req => req.params as { delay: number }),
        mergeMap(params => of({}).pipe(
          delay(params.delay),
          mapTo({ body: `delay_${params.delay}` }),
        )),
      );

    const routing: Routing = [{
      regExp: path.regExp,
      path: path.path,
      methods: { GET: { effect: effect, middlewares: [], parameters: ['delay'] } },
    }];

    // when
    const { resolve, outputSubject } = resolveRouting(routing, ctx)();
    const run = () => {
      resolve(testData[0]); // 10 delay
      resolve(testData[3]); // 40 delay
      resolve(testData[2]); // 30 delay
      resolve(testData[1]); // 20 delay
    };

    // then
    outputSubject.pipe(take(4), toArray()).subscribe(
      result => {
        expect(result[0].res).toEqual({ body: 'delay_10', request: testData[0] });
        expect(result[1].res).toEqual({ body: 'delay_20', request: testData[1] });
        expect(result[2].res).toEqual({ body: 'delay_30', request: testData[2] });
        expect(result[3].res).toEqual({ body: 'delay_40', request: testData[3] });
        done();
      },
    );

    run();
  });

  test('handles concurrent requests for different paths', done => {
    const createRoute = (routeDelay: number) => {
      const req = createHttpRequest(({ url: `/delay_${routeDelay}`, method: 'GET' }));
      const path = factorizeRegExpWithParams(`/delay_${routeDelay}`);

      const effect: HttpEffect = req$ =>
        req$.pipe(
          delay(routeDelay),
          mapTo({ body: `delay_${routeDelay}` }),
        );

      const item: RoutingItem = {
        regExp: path.regExp,
        path: path.path,
        methods: { 'GET': { effect, middlewares: [] } },
      };

      return { req, path, effect, item };
    };

    // given
    const delays = [10, 20, 30, 40];
    const ctx = createMockEffectContext();

    // [0] GET /delay_10
    // [1] GET /delay_20
    // [2] GET /delay_30
    // [3] GET /delay_40
    const testData = delays.map(createRoute);
    const routing: Routing = testData.map(route => route.item);

    // when
    const { resolve, outputSubject } = resolveRouting(routing, ctx)();
    const run = () => {
      resolve(testData[0].req); // 10 delay
      resolve(testData[3].req); // 40 delay
      resolve(testData[2].req); // 30 delay
      resolve(testData[1].req); // 20 delay
    };

    // then
    outputSubject.pipe(take(4), toArray()).subscribe(
      result => {
        expect(result[0].res).toEqual({ body: 'delay_10', request: testData[0].req });
        expect(result[1].res).toEqual({ body: 'delay_20', request: testData[1].req });
        expect(result[2].res).toEqual({ body: 'delay_30', request: testData[2].req });
        expect(result[3].res).toEqual({ body: 'delay_40', request: testData[3].req });
        done();
      },
    );

    run();
  });
});
