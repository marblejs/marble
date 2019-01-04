import { mapTo } from 'rxjs/operators';
import { WebSocketErrorEffect } from '../../effects/ws-effects.interface';
import { error$ as defaultError$ } from '../ws-error.effect';
import { provideErrorEffect } from '../ws-error.provider';

describe('#provideErrorEffect', () => {
  test('provides passed error$', () => {
    // given
    const transformer = undefined;
    const error$: WebSocketErrorEffect = event$ => event$.pipe(
      mapTo({ type: 'ERROR', payload: 'error' }),
    );

    // when
    const providedError$ = provideErrorEffect(error$, transformer);

    // then
    expect(providedError$).toBe(error$);
  });

  test('provides default error$ if transformer is not defined and error$ is not passed', () => {
    // given
    const transformer = undefined;
    const error$ = undefined;

    // when
    const providedError$ = provideErrorEffect(error$, transformer);

    // then
    expect(providedError$).toBe(defaultError$);
  });
});
