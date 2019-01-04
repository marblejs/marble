import { matchType, mapToServer, broadcast } from './index';

test('exposed operators are available', () => {
  expect(broadcast).toBeDefined();
  expect(matchType).toBeDefined();
  expect(mapToServer).toBeDefined();
});
