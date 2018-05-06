import { Effect, EffectResponse, GroupedEffects } from './effects.interface';

export const isGroup = (item): item is GroupedEffects =>
  typeof item === 'object' && !!item.path && !!item.effects;

export const isEffect = (item): item is Effect<EffectResponse> =>
  !isGroup(item);
