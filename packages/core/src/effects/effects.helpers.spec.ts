import { mapTo } from 'rxjs/operators';
import { isEffect, isGroup, isRouteCombinerConfig, isRouteCombinerEffects } from './effects.helpers';
import { Effect, GroupedEffects, RouteCombinerConfig } from './effects.interface';

describe('Effects helpers', () => {

  test('#isGroup checks if parameters is GroupedEffects type', () => {
    expect(isGroup({ path: '/test', effects: [] } as GroupedEffects)).toBe(true);
    expect(isGroup({ path: '/test', effects: {} } as GroupedEffects)).toBe(false);
    expect(isGroup({ effects: [] } as any as  GroupedEffects)).toBe(false);
  });

  test('#isEffect checks if parameters is GroupedEffects type', () => {
    // given
    const effect$: Effect = request$ => request$.pipe(mapTo({}));
    const groupedEffects = { path: '/test', effects: [effect$], middlewares: [] };

    // when
    const effect = isEffect(effect$);
    const group = isEffect(groupedEffects);

    // then
    expect(effect).toBe(true);
    expect(group).toBe(false);
  });

  test('#isRouteCombinerConfig checks if parameter is a configuration object', () => {
    // given
    const effects = [];
    const combinedRoutes: RouteCombinerConfig = { middlewares: [], effects: [] };

    // when
    const combinedRoutesEffects = isRouteCombinerConfig(effects);
    const combinedRoutesConfig = isRouteCombinerConfig(combinedRoutes);

    // then
    expect(combinedRoutesConfig).toBe(true);
    expect(combinedRoutesEffects).toBe(false);
  });

  test('#isRouteCombinerEffects checks if parameters is a collection of effects', () => {
    // given
    const effects = [];
    const combinedRoutes: RouteCombinerConfig = { middlewares: [], effects: [] };

    // when
    const combinedRoutesEffects = isRouteCombinerEffects(effects);
    const combinedRoutesConfig = isRouteCombinerEffects(combinedRoutes);

    // then
    expect(combinedRoutesConfig).toBe(false);
    expect(combinedRoutesEffects).toBe(true);
  });

});
