import { of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Middleware } from '../effects.interface';
import { combineMiddlewares } from '../effects.combiner';
import { HttpResponse, HttpRequest } from '../../http.interface';
import { Marbles } from '../../+internal';

const createMockRes = () => ({} as HttpResponse);
const createMockReq = (url = '/') => ({ url } as HttpRequest);

describe('#combineMiddlewares', () => {
  test('combines middlewares into one stream', () => {
    // given
    const a$: Middleware = req$ => req$.pipe(tap(req => { req.test = 1; }));
    const b$: Middleware = req$ => req$.pipe(tap(req => { req.test = req.test + 1; }));
    const c$: Middleware = req$ => req$.pipe(tap(req => { req.test = req.test + 1; }));

    // when
    const req = createMockReq();
    const res = createMockRes();
    const combinedMiddlewares = combineMiddlewares([ a$, b$, c$ ]);
    const http$ = combinedMiddlewares(of(req), res, undefined);

    // then
    Marbles.assertCombinedEffects(http$, [
      '(a|)', {
        a: { url: '/', test: 3 }
      }
    ]);
  });

  test('returns stream even if middlewares are not provided', () => {
    // when
    const req = createMockReq();
    const res = createMockRes();
    const combinedMiddlewares = combineMiddlewares();
    const http$ = combinedMiddlewares(of(req), res, undefined);

    // then
    Marbles.assertCombinedEffects(http$, [
      '(a|)', {
        a: { url: '/' }
      }
    ]);
  });
});
