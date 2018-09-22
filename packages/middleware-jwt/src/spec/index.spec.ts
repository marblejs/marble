import * as API from '../index';

describe('@marblejs/middleware-jwt public API', () => {

  it('should be defined', () => {
    expect(API.authorize$).toBeDefined();
    expect(API.generateExpirationInHours).toBeDefined();
    expect(API.generateToken).toBeDefined();
    expect(API.verifyToken).toBeDefined();
    expect(API.verifyToken$).toBeDefined();
  });

});
