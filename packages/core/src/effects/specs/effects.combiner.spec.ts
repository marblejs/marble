import { of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Middleware } from '../effects.interface';
import { combineMiddlewareEffects } from '../effects.combiner';
import { HttpResponse, HttpRequest } from '../../http.interface';
import { Marbles } from '@shared';

const createMockRes = () => ({} as HttpResponse);
const createMockReq = (url = '/') => ({ url } as HttpRequest);

describe('Effects combiner', () => {

  test('#combineMiddlewareEffects combines middlewares into one stream', () => {
    // given
    const a$: Middleware = req$ => req$.pipe(tap(req => { req.test = 1; }));
    const b$: Middleware = req$ => req$.pipe(tap(req => { req.test = req.test + 1; }));
    const c$: Middleware = req$ => req$.pipe(tap(req => { req.test = req.test + 1; }));

    // when
    const req = createMockReq();
    const res = createMockRes();
    const combinedEffect = combineMiddlewareEffects([ a$, b$, c$ ]);
    const http$ = combinedEffect(of(req), res, undefined);

    // then
    Marbles.assertCombinedEffects(http$, [
      '(a|)', {
        a: { url: '/', test: 3 }
      }
    ]);
  });

  test('#combineMiddlewareEffects returns stream even if middlewares are not provided', () => {
    // given
    const emptyMiddlewaresCollection = [];

    // when
    const req = createMockReq();
    const res = createMockRes();
    const combinedEffect = combineMiddlewareEffects(emptyMiddlewaresCollection);
    const http$ = combinedEffect(of(req), res, undefined);

    // then
    Marbles.assertCombinedEffects(http$, [
      '(a|)', {
        a: { url: '/' }
      }
    ]);
  });

});
