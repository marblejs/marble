import { HttpMiddlewareEffect, HttpEffect } from '../../effects/http.effects.interface';
import { r } from '../http.router.ixbuilder';

describe('#IxRouteBuilder', () => {
  test('builds EffectRoute with required ingredients', () => {
    const e$: HttpEffect = req$ => req$;

    const route = r.pipe(
      r.matchPath('/'),
      r.matchType('GET'),
      r.useEffect(e$),
    );

    expect(route.path).toEqual('/');
    expect(route.method).toEqual('GET');
    expect(route.effect).toEqual(e$);
    expect(route.middleware).toBeUndefined();
    expect(route.effect).toBeInstanceOf(Function);
  });

  test('builds EffectRoute with chain of middlewares applied', () => {
    const m$: HttpMiddlewareEffect = req$ => req$;
    const e$: HttpEffect = req$ => req$;

    const route = r.pipe(
      r.matchPath('/'),
      r.matchType('GET'),
      r.use(m$),
      r.use(m$),
      r.use(m$),
      r.useEffect(e$),
    );

    expect(route.path).toEqual('/');
    expect(route.method).toEqual('GET');
    expect(route.effect).toEqual(e$);
    expect(route.middleware).toBeInstanceOf(Function);
    expect(route.effect).toBeInstanceOf(Function);
    expect(route.meta).toBeUndefined();
  });

  test('builds EffectRoute with chain of meta attributes applied', () => {
    const e$: HttpEffect = req$ => req$;

    const route = r.pipe(
      r.matchPath('/'),
      r.matchType('GET'),
      r.useEffect(e$),
      r.applyMeta({ test1: 1 }),
      r.applyMeta({ test2: 2 }),
    );

    expect(route.path).toEqual('/');
    expect(route.method).toEqual('GET');
    expect(route.effect).toEqual(e$);
    expect(route.meta).toEqual({ test1: 1, test2: 2 });
  });
});
