/* eslint-disable deprecation/deprecation */
import * as API from './index';

describe('@marblejs/core public API', () => {
  test('apis are defined', () => {
    expect(API.combineEffects).toBeDefined();
    expect(API.combineMiddlewares).toBeDefined();
    expect(API.createEffectContext).toBeDefined();
    expect(API.event).toBeDefined();
    expect(API.coreErrorFactory).toBeDefined();

    // errors
    expect(API.CoreError).toBeDefined();
    expect(API.EventError).toBeDefined();
    expect(API.isEventError).toBeDefined();
    expect(API.isCoreError).toBeDefined();

    // operators
    expect(API.use).toBeDefined();
    expect(API.act).toBeDefined();
    expect(API.matchEvent).toBeDefined();
  });
});
