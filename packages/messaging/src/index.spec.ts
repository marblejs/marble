import * as API from './index';

describe('@marblejs/messaging', () => {
  test('public APIs are defined', () => {
    expect(API.Transport).toBeDefined();
    expect(API.TransportLayerToken).toBeDefined();
    expect(API.ServerEvent).toBeDefined();
    expect(API.createMicroservice).toBeDefined();
    expect(API.messagingClient).toBeDefined();
    expect(API.messagingListener).toBeDefined();
    expect(API.reply).toBeDefined();
  });
});
