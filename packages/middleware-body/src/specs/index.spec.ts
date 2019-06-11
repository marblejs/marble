import * as API from '../index';

describe('@marblejs/middleware-body public API', () => {
  test('apis are defined', () => {
    expect(API.bodyParser$).toBeDefined();
    expect(API.defaultParser).toBeDefined();
    expect(API.jsonParser).toBeDefined();
    expect(API.rawParser).toBeDefined();
    expect(API.textParser).toBeDefined();
    expect(API.urlEncodedParser).toBeDefined();
  });
});
