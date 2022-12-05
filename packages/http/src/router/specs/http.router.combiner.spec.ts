import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { combineRoutes } from '../http.router.combiner';
import { r } from '../http.router.ixbuilder';
import { HttpMiddlewareEffect } from '../../effects/http.effects.interface';
import { HttpRequest } from '../../http.interface';

describe('#combineRoutes', () => {
  test('factorizes combined routes for effects only', () => {
    // given
    const effect$ = (req$: Observable<HttpRequest>) => req$.pipe(map(() => ({})));

    const a$ = r.pipe(
      r.matchPath('/a'),
      r.matchType('GET'),
      r.useEffect(effect$));

    const b$ = r.pipe(
      r.matchPath('/b'),
      r.matchType('GET'),
      r.useEffect(effect$));

    // when
    const combiner = combineRoutes('/test', [a$, b$]);

    // then
    expect(combiner).toEqual({
      path: '/test',
      middlewares: [],
      effects: [a$, b$],
    });
  });

  test('factorizes combined routes for effects with middlewares', () => {
    // given
    const effect$ = (req$: Observable<HttpRequest>) => req$.pipe(map(() => ({})));

    const a$ = r.pipe(
      r.matchPath('/a'),
      r.matchType('GET'),
      r.useEffect(effect$));

    const b$ = r.pipe(
      r.matchPath('/b'),
      r.matchType('GET'),
      r.useEffect(effect$));

    const m1$: HttpMiddlewareEffect = req$ => req$;
    const m2$: HttpMiddlewareEffect = req$ => req$;

    // when
    const combiner = combineRoutes('/test', {
      middlewares: [m1$, m2$],
      effects: [a$, b$],
    });

    // then
    expect(combiner).toEqual({
      path: '/test',
      middlewares: [m1$, m2$],
      effects: [a$, b$],
    });
  });

  test('factorizes combined routes for effects with empty middlewares', () => {
    // given
    const effect$ = (req$: Observable<HttpRequest>) => req$.pipe(map(() => ({})));

    const a$ = r.pipe(
      r.matchPath('/a'),
      r.matchType('GET'),
      r.useEffect(effect$));

    const b$ = r.pipe(
      r.matchPath('/b'),
      r.matchType('GET'),
      r.useEffect(effect$));

    // when
    const combiner = combineRoutes('/test', {
      effects: [a$, b$],
    });

    // then
    expect(combiner).toEqual({
      path: '/test',
      middlewares: [],
      effects: [a$, b$],
    });
  });
});
