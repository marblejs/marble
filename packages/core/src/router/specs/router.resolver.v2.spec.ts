// import { mapTo, take } from 'rxjs/operators';
// import { HttpEffect } from '../../effects/http-effects.interface';
// import { Routing } from '../router.interface';
// import { resolveRouting } from '../router.resolver.v2';
// import { createMockEffectContext, createHttpRequest } from '../../+internal';
// import { of, forkJoin } from 'rxjs';
// import { factorizeRegExpWithParams } from '../router.params.factory';

// describe('#findRoute', () => {
//   test('finds route inside collection', async (done) => {
//     // given
//     const ctx = createMockEffectContext();

//     const path1 = factorizeRegExpWithParams('/');
//     const path2 = factorizeRegExpWithParams('/group');
//     const path3 = factorizeRegExpWithParams('/group/nested/foo');

//     const e1$: HttpEffect = req$ => req$.pipe(mapTo({ body: 'test_1' }));
//     const e2$: HttpEffect = req$ => req$.pipe(mapTo({ body: 'test_2' }));
//     const e3$: HttpEffect = req$ => req$.pipe(mapTo({ body: 'test_3' }));
//     const e4$: HttpEffect = req$ => req$.pipe(mapTo({ body: 'test_4' }));

//     const req1 = createHttpRequest(({ url: '/', method: 'GET' }));
//     const req2 = createHttpRequest(({ url: '/', method: 'POST' }));
//     const req3 = createHttpRequest(({ url: '/group', method: 'GET' }));
//     const req4 = createHttpRequest(({ url: '/group/nested/foo', method: 'POST' }));

//     const routing: Routing = [
//       {
//         regExp: path1.regExp,
//         path: path1.path,
//         methods: { GET: { effect: e1$ }, POST: { effect: e2$ } },
//       },
//       {
//         regExp: path2.regExp,
//         path: path2.path,
//         methods: { GET: { effect: e3$ } },
//       },
//       {
//         regExp: path3.regExp,
//         path: path3.path,
//         methods: { POST: { effect: e4$ } },
//       },
//     ];

//     // when
//     const routing$ = resolveRouting(routing, ctx);
//     const e1Result = await routing$(of(req1)).toPromise();
//     const e2Result = await routing$(of(req2)).toPromise();
//     const e3Result = await routing$(of(req3)).toPromise();
//     const e4Result = await routing$(of(req4)).toPromise();

//     // then
//     forkJoin([
//       e1Result.subject.pipe(take(1)),
//       e2Result.subject.pipe(take(1)),
//       e3Result.subject.pipe(take(1)),
//       e4Result.subject.pipe(take(1)),
//     ]).subscribe(
//       result => {
//         expect(result[0]).toEqual({ body: 'test_1' });
//         expect(result[1]).toEqual({ body: 'test_2' });
//         expect(result[2]).toEqual({ body: 'test_3' });
//         expect(result[3]).toEqual({ body: 'test_4' });
//         done();
//       },
//     )

//     e1Result.subject.next(e1Result.req);
//     e2Result.subject.next(e2Result.req);
//     e3Result.subject.next(e3Result.req);
//     e4Result.subject.next(e4Result.req);
//   });
// });
