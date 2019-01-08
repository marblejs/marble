import { mapToServer, broadcast } from './index';

test('exposed operators are available', () => {
  expect(broadcast).toBeDefined();
  expect(mapToServer).toBeDefined();
});
