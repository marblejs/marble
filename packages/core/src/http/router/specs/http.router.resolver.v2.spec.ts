import { mapTo, take, toArray } from 'rxjs/operators';
import { createMockEffectContext, createHttpRequest, createHttpResponse } from '../../../+internal';
import { HttpEffect } from '../../effects/http.effects.interface';
import { Routing } from '../http.router.interface';
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
});
