import * as API from '../index';

describe('@marblejs/middleware-io public API', () => {
  test('apis are defined', () => {
    expect(API.defaultReporter).toBeDefined();
    expect(API.eventValidator$).toBeDefined();
    expect(API.httpValidator$).toBeDefined();
    expect(API.validator$).toBeDefined();
    expect(API.io).toBeDefined();
  });
});
