import * as API from '../index';

describe('@marblejs/middleware-multipart public API', () => {
  test('apis are defined', () => {
    expect(API.multipart$).toBeDefined();
  });
});
