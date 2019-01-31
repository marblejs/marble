import * as API from '../index';

describe('@marblejs/middleware-body public API', () => {
  test('apis are defined', () => {
    expect(API.bodyParser$).toBeDefined();
  });
});
