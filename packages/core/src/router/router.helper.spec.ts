import { isRouteEffectGroup, isRouteCombinerConfig } from './router.helpers';

describe('Router helper', () => {

  test('#isRouteGroup checks if provided argument is typeof RouteGroup', () => {
    expect(isRouteEffectGroup({ path: '/', effects: [], middlewares: [] })).toEqual(true);
    expect(isRouteEffectGroup({ path: '/', effects: [] })).toEqual(false);
    expect(isRouteEffectGroup({ path: '/', method: 'GET', effect: req$ => req$ })).toEqual(false);
  });

  test('#isRouteCombinerConfig checks if provided argument is typeof RouteCombinerConfig', () => {
    expect(isRouteCombinerConfig({ effects: [], middlewares: [] })).toEqual(true);
    expect(isRouteCombinerConfig([req$ => req$])).toEqual(false);
  });

});
