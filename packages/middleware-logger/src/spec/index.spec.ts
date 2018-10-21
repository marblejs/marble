import * as index from '../index';

test('index exposes public API', () => {
  expect(index.logger$).toBeDefined();
  expect(index.loggerWithOpts$).toBeDefined();
});
