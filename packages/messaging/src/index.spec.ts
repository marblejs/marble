import * as API from './index';

describe('@marblejs/messaging', () => {
  test('public APIs are defined', () => {
    expect(API.Transport).toBeDefined();
    expect(API.TransportLayerToken).toBeDefined();
    expect(API.ServerEvent).toBeDefined();
    expect(API.createMicroservice).toBeDefined();
    expect(API.MessagingClient).toBeDefined();
    expect(API.messagingListener).toBeDefined();
    expect(API.EventBus).toBeDefined();
    expect(API.EventBusClient).toBeDefined();
    expect(API.EventBusClientToken).toBeDefined();
    expect(API.EventBusToken).toBeDefined();
    expect(API.reply).toBeDefined();
    expect(API.ackEvent).toBeDefined();
    expect(API.nackEvent).toBeDefined();
    expect(API.nackAndResendEvent).toBeDefined();
    expect(API.EVENT_BUS_CHANNEL).toBeDefined();
    expect(API.AmqpConnectionStatus).toBeDefined();
    expect(API.RedisConnectionStatus).toBeDefined();
  });
});
