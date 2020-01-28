import { delay, tap } from 'rxjs/operators';
import { isTestEnv } from '@marblejs/core/dist/+internal/utils';

const getRandomFrom1To10 = () => Math.floor(Math.random() * 10);

export const simulateRandomDelay =
  delay(isTestEnv() ? 0 : getRandomFrom1To10() * 1000);

export const simulateRandomFailure = tap(() => {
  const test = getRandomFrom1To10();
  if (isTestEnv()) return;
  if (test > 6) throw new Error('Some random error');
});
