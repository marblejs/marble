import { Effect, EffectResponse, Effects, GroupedEffects, RouteCombinerConfig } from './effects.interface';

export const isGroup = (item: Effect | GroupedEffects): item is GroupedEffects =>
  typeof item === 'object'
  && !!item.path
  && !!item.effects
  && typeof item.path === 'string'
  && Array.isArray(item.effects);

export const isEffect = (item: Effect | GroupedEffects): item is Effect<EffectResponse> =>
  !isGroup(item)
  && typeof item === 'function';

export const isRouteCombinerConfig = (item: RouteCombinerConfig | Effects): item is RouteCombinerConfig =>
  !Array.isArray(item);

export const isRouteCombinerEffects = (item: RouteCombinerConfig | Effects): item is Effects =>
  !isRouteCombinerConfig(item);
