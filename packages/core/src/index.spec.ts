import * as API from './index';

describe('@marblejs/core public API', () => {
  test('apis are defined', () => {
    expect(API.httpListener).toBeDefined();
    expect(API.defaultError$).toBeDefined();
    expect(API.EffectFactory).toBeDefined();
    expect(API.combineRoutes).toBeDefined();
    expect(API.combineEffects).toBeDefined();
    expect(API.combineMiddlewares).toBeDefined();
    expect(API.createEffectContext).toBeDefined();
    expect(API.event).toBeDefined();
    expect(API.coreErrorFactory).toBeDefined();
    expect(API.r).toBeDefined();

    // errors
    expect(API.HttpError).toBeDefined();
    expect(API.HttpRequestError).toBeDefined();
    expect(API.CoreError).toBeDefined();
    expect(API.EventError).toBeDefined();
    expect(API.isEventError).toBeDefined();
    expect(API.isCoreError).toBeDefined();
    expect(API.isHttpError).toBeDefined();
    expect(API.isHttpRequestError).toBeDefined();

    // operators
    expect(API.use).toBeDefined();
    expect(API.act).toBeDefined();
    expect(API.switchToProtocol).toBeDefined();
    expect(API.matchEvent).toBeDefined();

    // internal dependencies
    expect(API.HttpServerEventStreamToken).toBeDefined();
    expect(API.HttpRequestMetadataStorageToken).toBeDefined();
    expect(API.HttpRequestBusToken).toBeDefined();
  });
});
