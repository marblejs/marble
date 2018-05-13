import { mapTo } from 'rxjs/operators';
import { isEffect, isGroup } from './effects.helpers';
import { Effect, GroupedEffects } from './effects.interface';

describe('Effects helpers', () => {

  it('#isGroup checks if parameters is GroupedEffects type', () => {
    expect(isGroup({ path: '/test', effects: [] })).toBe(true);
    expect(isGroup({ path: '/test', effects: {} } as GroupedEffects)).toBe(false);
    expect(isGroup({ path: '/test', effects: {} } as GroupedEffects)).toBe(false);
    expect(isGroup({ effects: [] } as any as  GroupedEffects)).toBe(false);
  });

  it('#isEffect checks if parameters is GroupedEffects type', () => {
    const effect$: Effect = request$ => request$.pipe(mapTo({}));
    const groupedEffects = { path: '/test', effects: [effect$] };

    expect(isEffect(effect$)).toBe(true);
    expect(isEffect(groupedEffects)).toBe(false);
  });
});
