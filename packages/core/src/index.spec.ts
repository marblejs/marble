import * as API from './index';

describe('@marblejs/core public API', () => {

  it('apis should be defined', () => {
    expect(API.httpListener).toBeDefined();
    expect(API.HttpError).toBeDefined();
    expect(API.error$).toBeDefined();
    expect(API.EffectFactory).toBeDefined();
    expect(API.combineRoutes).toBeDefined();
  });

});
