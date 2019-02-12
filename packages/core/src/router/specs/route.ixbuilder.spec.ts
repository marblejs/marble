import { r } from '../router.ixbuilder';
import { HttpMiddlewareEffect, HttpEffect } from '../../effects/http-effects.interface';

describe('#IxRouteBuilder', () => {
  test('builds EffectRoute with all ingridients', () => {
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
  });

  test('builds EffectRoute without middleware', () => {
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
});
