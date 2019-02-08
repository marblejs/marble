import { checkOrigin, checkStringOrigin, checkArrayOrigin, checkRegexpOrigin } from './checkOrigin';
import { createMockRequest } from './middleware.spec';

describe('checkOrigin', () => {
  test('check wildcard option correctly', done => {
    const option = '*';
    const req = createMockRequest('GET', { origin: 'fake-origin' });

    expect(checkOrigin(req, option)).toBeTruthy();
    done();
  });

  test('check string option correctly', done => {
    const option1 = 'fake-origin';
    const option2 = 'fake-origin-2';
    const req1 = createMockRequest('GET', { origin: 'fake-origin' });
    const req2 = createMockRequest('GET', { origin: 'fake-origin' });

    expect(checkOrigin(req1, option1)).toBeTruthy();
    expect(checkOrigin(req2, option2)).toBeFalsy();
    done();
  });

  test('check array option correctly', done => {
    const option1 = ['fake-origin-b', 'fake-origin-a'];
    const option2 = ['another-origin-a', 'another-origin-b'];
    const req1 = createMockRequest('GET', { origin: 'fake-origin-a' });
    const req2 = createMockRequest('GET', { origin: 'fake-origin-c' });

    expect(checkOrigin(req1, option1)).toBeTruthy();
    expect(checkOrigin(req2, option2)).toBeFalsy();
    done();
  });

  test('check regexp option correctly', done => {
    const option1 = /[a-z]/;
    const option2 = /[0-9]/;
    const req1 = createMockRequest('GET', { origin: 'fake-origin-a' });
    const req2 = createMockRequest('GET', { origin: 'fake-origin-c' });

    expect(checkOrigin(req1, option1)).toBeTruthy();
    expect(checkOrigin(req2, option2)).toBeFalsy();
    done();
  });
});

describe('checkStringOrigin', () => {
  test('check string option correctly', done => {
    const option1 = 'fake-origin';
    const option2 = 'fake-origin-2';

    expect(checkStringOrigin('fake-origin', option1)).toBeTruthy();
    expect(checkStringOrigin('fake-origin', option2)).toBeFalsy();
    done();
  });
});

describe('checkArrayOrigin', () => {
  test('check array option correctly', done => {
    const option1 = ['fake-origin'];
    const option2 = ['fake-origin-2'];

    expect(checkArrayOrigin('fake-origin', option2)).toBeFalsy();
    expect(checkArrayOrigin('fake-origin', option1)).toBeTruthy();
    done();
  });
});

describe('checkStringOrigin', () => {
  test('check regexp option correctly', done => {
    const option1 = /[a-z]/;
    const option2 = /[0-9]/;

    expect(checkRegexpOrigin('fake-origin', option1)).toBeTruthy();
    expect(checkRegexpOrigin('fake-origin', option2)).toBeFalsy();
    done();
  });
});
