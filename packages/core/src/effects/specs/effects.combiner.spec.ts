import { tap, mapTo, filter } from 'rxjs/operators';
import { Middleware, Effect } from '../effects.interface';
import { combineMiddlewares, combineEffects } from '../effects.combiner';
import { Marbles, createHttpRequest } from '../../+internal';

describe('#combineMiddlewares', () => {
  test('combines middlewares into one stream', () => {
    // given
    const a$: Middleware = req$ => req$.pipe(tap(req => { req.test = 1; }));
    const b$: Middleware = req$ => req$.pipe(tap(req => { req.test = req.test + 1; }));
    const c$: Middleware = req$ => req$.pipe(tap(req => { req.test = req.test + 1; }));
    const incomingRequest = createHttpRequest({ url: '/' });
    const outgoingRequest = createHttpRequest({ url: '/', test: 3 });

    // when
    const middlewares$ = combineMiddlewares(a$, b$, c$);

    // then
    Marbles.assertEffect(middlewares$, [
      ['(a|)', { a: incomingRequest }],
      ['(a|)', { a: outgoingRequest }],
    ]);
  });

  test('returns stream even if middlewares are not provided', () => {
    // given
    const incomingRequest = createHttpRequest({ url: '/' });
    const outgoingRequest = createHttpRequest({ url: '/' });

    // when
    const middlewares$ = combineMiddlewares();

    // then
    Marbles.assertEffect(middlewares$, [
      ['(a|)', { a: incomingRequest }],
      ['(a|)', { a: outgoingRequest }],
    ]);
  });
});

describe('#combineEffects', () => {
  test('combines effects into multiple streams', () => {
    // given
    const a$: Effect = req$ => req$.pipe(filter(req => req.url === '/a'), mapTo({ body: 'a' }));
    const b$: Effect = req$ => req$.pipe(filter(req => req.url === '/b'), mapTo({ body: 'b' }));
    const c$: Effect = req$ => req$.pipe(filter(req => req.url === '/c'), mapTo({ body: 'c' }));
    const a = createHttpRequest({ url: '/a' });
    const b = createHttpRequest({ url: '/b' });
    const c = createHttpRequest({ url: '/c' });

    // when
    const effects$ = combineEffects(a$, b$, c$);

    // then
    Marbles.assertEffect(effects$, [
      ['-a--b--c---', { a, b, c }],
      ['-a--b--c---', {
        a: { body: 'a'},
        b: { body: 'b' },
        c: { body: 'c' },
      }],
    ]);
  });
});
