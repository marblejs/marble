import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { Marbles } from '../../+internal/testing';
import { HttpEffect } from '../../http/effects/http.effects.interface';
import { HttpRequest } from '../../http/http.interface';
import { use } from './use.operator';

const createMockReq = (req: Partial<HttpRequest>) => req;

describe('#use operator', () => {
  test('applies middlewares to the request pipeline', () => {
    const m$ = <T extends HttpRequest<number>>(req$: Observable<T>) =>
      req$.pipe(
        tap(req => req.body++)
      );

    const effect$: HttpEffect<HttpRequest<number>> = req$ => req$.pipe(
      use(m$),
      use(m$),
    );

    Marbles.assertEffect(effect$, [
      ['-a---', { a: createMockReq({ body: 0 }) }],
      ['-a---', { a: createMockReq({ body: 2 }) }],
    ]);
  });

  test('infers types from composed middlewares', () => {
    interface AuthorizedHttpRequest extends HttpRequest {
      user: { id: string };
    }

    const m1$ = <T extends HttpRequest>(req$: Observable<T>) =>
      req$.pipe(
        tap(req => req.body = { test: 'test' }),
      ) as Observable<HttpRequest<{ test: string }, T['params'], T['query']>>;

    const m2$ = <T extends HttpRequest>(req$: Observable<T>) =>
      req$.pipe(
        tap(req => req.params = { test: true }),
      ) as Observable<HttpRequest<T['body'], { test: boolean }, T['query']>>;

    const m3$ = <T extends HttpRequest>(req$: Observable<T>) =>
      req$.pipe(
        tap(req => req.query = { test: 3 }),
      ) as Observable<HttpRequest<{ test: boolean }, T['params'], { test: number }>>;

    const m4$ = <T extends HttpRequest>(req$: Observable<T>) =>
      req$.pipe(
        map(req => req as AuthorizedHttpRequest & T),
        tap(req => req.user = { id: 'test_id' }),
      ) as Observable<AuthorizedHttpRequest & T>;

    const effect$: HttpEffect = req$ =>
      req$.pipe(
        use(m1$),
        use(m2$),
        use(m3$),
        use(m4$),
        tap(req => req.body.test as boolean),
        tap(req => req.params.test as boolean),
        tap(req => req.query.test as number),
        tap(req => req.user.id as string),
        map(req => ({ body: {
          body: req.body,
          params: req.params,
          query: req.query,
          user: req.user,
        }})),
      );

    const expectedResult = {
      body: {
        body:   { test: 'test' },
        params: { test: true },
        query:  { test: 3 },
        user:   { id: 'test_id' },
      }
    };

    Marbles.assertEffect(effect$, [
      ['-a---', { a: createMockReq({ params: {}, query: {} }) }],
      ['-a---', { a: expectedResult }],
    ]);
  });
});
