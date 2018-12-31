import * as API from './index';

describe('@marblejs/websockets', () => {
  test('public APIs are defined', () => {
    expect(API.broadcast).toBeDefined();
    expect(API.mapToAction).toBeDefined();
    expect(API.mapToServer).toBeDefined();
    expect(API.matchType).toBeDefined();
    expect(API.error$).toBeDefined();
    expect(API.jsonTransformer).toBeDefined();
    expect(API.webSocketListener).toBeDefined();
  });
});
