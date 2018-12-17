import * as API from './index';

describe('@marblejs/core public API', () => {
  test('apis are defined', () => {
    expect(API.httpListener).toBeDefined();
    expect(API.HttpError).toBeDefined();
    expect(API.defaultError$).toBeDefined();
    expect(API.EffectFactory).toBeDefined();
    expect(API.combineRoutes).toBeDefined();
  });
});
