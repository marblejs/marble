import * as API from '../index';

describe('@marblejs/middleware-io public API', () => {
  test('apis are defined', () => {
    expect(API.defaultReporter).toBeDefined();
    expect(API.validateEvent).toBeDefined();
    expect(API.validateRequest).toBeDefined();
    expect(API.validator$).toBeDefined();
    expect(API.t).toBeDefined();

    // deprecated API
    expect(API.requestValidator$).toBeDefined();
    expect(API.eventValidator$).toBeDefined();
  });
});
