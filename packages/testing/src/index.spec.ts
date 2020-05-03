import * as API from './index';

describe('@marblejs/testing', () => {
  test('public APIs are defined', () => {
    expect(API.TestBedType).toBeDefined();
    expect(API.createTestBedSetup).toBeDefined();
    expect(API.createHttpTestBed).toBeDefined();
    expect(API.createTestBedContainer).toBeDefined();
  });
});
